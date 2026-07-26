import { useCallback, useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { inventoryService, toInventoryError } from '../services/inventoryService';
import type { ProductImage } from '../types/inventory';
import {
  MAX_IMAGES_PER_PRODUCT,
  compressImage,
  validateImageFile,
} from '../utils/imageCompression';

/** An image chosen but not yet stored on the server. */
export interface StagedImage {
  id: string;
  file: File | Blob;
  name: string;
  /** Object URL for the preview. Revoked when the entry goes. */
  previewUrl: string;
  bytes: number;
  originalBytes: number;
  /** 0–100 while uploading, null while still being prepared. */
  progress: number | null;
  error?: string;
}

let stagedIdCounter = 0;

/**
 * Owns a product's gallery: what is saved, what is in flight, and the order.
 *
 * Two modes, driven by whether the product exists yet:
 *
 * - **Editing** — files upload the moment they are chosen, so a half-finished
 *   edit still keeps its photos.
 * - **Creating** — there is no product to attach them to, so files are held
 *   locally with previews and `flushTo` uploads them once the product has an
 *   id. Nothing is written until the user commits.
 */
export const useProductImages = (productId: string | null, initial: ProductImage[] = []) => {
  const { tenantSlug } = useParams();

  const [images, setImages] = useState<ProductImage[]>(initial);
  const [staged, setStaged] = useState<StagedImage[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Previews are object URLs; without this every add/remove cycle leaks one.
  const stagedRef = useRef<StagedImage[]>([]);
  stagedRef.current = staged;
  useEffect(
    () => () => {
      stagedRef.current.forEach((item) => URL.revokeObjectURL(item.previewUrl));
    },
    []
  );

  /** Replaces the gallery when a different product is loaded. */
  const reset = useCallback((next: ProductImage[]) => {
    setImages(next);
    setError(null);
  }, []);

  const dropStaged = useCallback((id: string) => {
    setStaged((current) => {
      const match = current.find((item) => item.id === id);
      if (match) URL.revokeObjectURL(match.previewUrl);
      return current.filter((item) => item.id !== id);
    });
  }, []);

  const uploadOne = useCallback(
    async (entry: StagedImage, targetProductId: string) => {
      if (!tenantSlug) return;
      try {
        const uploaded = await inventoryService.uploadImages(
          tenantSlug,
          targetProductId,
          [entry.file],
          (percent) =>
            setStaged((current) =>
              current.map((item) =>
                item.id === entry.id ? { ...item, progress: percent } : item
              )
            )
        );
        setImages((current) => [...current, ...uploaded]);
        dropStaged(entry.id);
      } catch (err: any) {
        const message = toInventoryError(err);
        // The entry stays visible carrying its error so the user can see which
        // file failed and remove or retry it, rather than silently losing it.
        setStaged((current) =>
          current.map((item) =>
            item.id === entry.id ? { ...item, progress: null, error: message } : item
          )
        );
        setError(message);
      }
    },
    [tenantSlug, dropStaged]
  );

  /**
   * Validates, compresses and either uploads or stages the chosen files.
   * Returns the rejection reasons so the caller can report them.
   */
  const addFiles = useCallback(
    async (files: File[]): Promise<string[]> => {
      setError(null);
      const rejections: string[] = [];

      const room = MAX_IMAGES_PER_PRODUCT - images.length - staged.length;
      if (room <= 0) {
        const message = `A product can have at most ${MAX_IMAGES_PER_PRODUCT} images.`;
        setError(message);
        return [message];
      }

      const accepted: File[] = [];
      for (const file of files) {
        if (accepted.length >= room) {
          rejections.push(
            `Only ${room} more image${room === 1 ? '' : 's'} can be added; the rest were skipped.`
          );
          break;
        }
        const problem = validateImageFile(file);
        if (problem) {
          rejections.push(problem);
          continue;
        }
        accepted.push(file);
      }

      for (const file of accepted) {
        const compressed = await compressImage(file);
        const entry: StagedImage = {
          id: `staged-${++stagedIdCounter}`,
          file: compressed.file,
          name: file.name,
          previewUrl: URL.createObjectURL(compressed.file),
          bytes: compressed.bytes,
          originalBytes: compressed.originalBytes,
          progress: productId ? 0 : null,
        };
        setStaged((current) => [...current, entry]);
        if (productId) await uploadOne(entry, productId);
      }

      if (rejections.length > 0) setError(rejections[0]);
      return rejections;
    },
    [images.length, staged.length, productId, uploadOne]
  );

  /**
   * Removes a stored image. Optimistic: the tile disappears immediately and is
   * put back if the server refuses, because waiting on a round trip to acknowledge
   * a delete makes the gallery feel broken.
   */
  const removeImage = useCallback(
    async (imageId: string) => {
      if (!tenantSlug || !productId) return;
      const snapshot = images;
      setImages((current) => current.filter((image) => image.id !== imageId));
      try {
        const remaining = await inventoryService.deleteImage(tenantSlug, productId, imageId);
        setImages(remaining);
      } catch (err: any) {
        setImages(snapshot);
        setError(toInventoryError(err));
        throw err;
      }
    },
    [tenantSlug, productId, images]
  );

  /**
   * Applies a new order. Also optimistic — a drag that snaps back while the
   * server thinks about it is worse than one that occasionally reverts.
   */
  const reorderImages = useCallback(
    async (orderedIds: string[]) => {
      const snapshot = images;
      const byId = new Map(images.map((image) => [image.id, image]));
      const reordered = orderedIds
        .map((id) => byId.get(id))
        .filter((image): image is ProductImage => Boolean(image))
        .map((image, index) => ({ ...image, position: index }));

      setImages(reordered);

      // While creating there is nothing to persist to; the order is applied
      // when the staged files are uploaded.
      if (!tenantSlug || !productId) return;

      try {
        setImages(await inventoryService.reorderImages(tenantSlug, productId, orderedIds));
      } catch (err: any) {
        setImages(snapshot);
        setError(toInventoryError(err));
      }
    },
    [tenantSlug, productId, images]
  );

  /** Reorders staged entries locally, used while creating a product. */
  const reorderStaged = useCallback((orderedIds: string[]) => {
    setStaged((current) => {
      const byId = new Map(current.map((item) => [item.id, item]));
      return orderedIds
        .map((id) => byId.get(id))
        .filter((item): item is StagedImage => Boolean(item));
    });
  }, []);

  /**
   * Uploads everything staged to a product that now exists. Called once, right
   * after create. Staged order is preserved because the server appends in the
   * order it receives the parts.
   */
  const flushTo = useCallback(
    async (targetProductId: string): Promise<ProductImage[]> => {
      if (!tenantSlug || staged.length === 0) return [];
      const uploaded = await inventoryService.uploadImages(
        tenantSlug,
        targetProductId,
        staged.map((item) => item.file),
        (percent) =>
          setStaged((current) => current.map((item) => ({ ...item, progress: percent })))
      );
      staged.forEach((item) => URL.revokeObjectURL(item.previewUrl));
      setStaged([]);
      setImages(uploaded);
      return uploaded;
    },
    [tenantSlug, staged]
  );

  return {
    images,
    staged,
    error,
    hasStaged: staged.length > 0,
    isUploading: staged.some((item) => item.progress !== null && !item.error),
    canAddMore: images.length + staged.length < MAX_IMAGES_PER_PRODUCT,
    addFiles,
    removeImage,
    removeStaged: dropStaged,
    reorderImages,
    reorderStaged,
    flushTo,
    reset,
  };
};

export type ProductImageGallery = ReturnType<typeof useProductImages>;
