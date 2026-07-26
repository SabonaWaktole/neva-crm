import React, { useRef, useState } from 'react';
import type { DragEvent } from 'react';
import { AlertCircle, GripVertical, ImagePlus, Loader2, Star, Trash2 } from 'lucide-react';
import type { ProductImageGallery } from '../../../hooks/useProductImages';
import { resolveMediaUrl } from '../../../services/mediaService';
import {
  ACCEPTED_IMAGE_EXTENSIONS,
  MAX_IMAGES_PER_PRODUCT,
  MAX_IMAGE_BYTES,
  formatBytes,
} from '../../../utils/imageCompression';
import styles from './ProductImageManager.module.css';

export interface ProductImageManagerProps {
  gallery: ProductImageGallery;
  /** Reported so the page can raise a toast; the tile shows its own error too. */
  onRejected?: (reasons: string[]) => void;
  disabled?: boolean;
}

/** One draggable position in the gallery, saved or still uploading. */
interface Tile {
  id: string;
  src: string;
  srcSet?: string;
  label: string;
  /** null once stored; 0–100 while uploading. */
  progress: number | null;
  error?: string;
  isSaved: boolean;
  caption: string;
}

export const ProductImageManager: React.FC<ProductImageManagerProps> = ({
  gallery,
  onRejected,
  disabled = false,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDraggingFiles, setIsDraggingFiles] = useState(false);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dropTargetId, setDropTargetId] = useState<string | null>(null);

  const tiles: Tile[] = [
    ...gallery.images.map<Tile>((image, index) => ({
      id: image.id,
      src: resolveMediaUrl(image.url) ?? image.url,
      srcSet: image.srcSet,
      label: index === 0 ? 'Primary image' : `Image ${index + 1}`,
      progress: null,
      isSaved: true,
      caption: formatBytes(image.bytes),
    })),
    ...gallery.staged.map<Tile>((item) => ({
      id: item.id,
      src: item.previewUrl,
      label: item.name,
      progress: item.progress,
      error: item.error,
      isSaved: false,
      caption:
        item.bytes < item.originalBytes
          ? `${formatBytes(item.originalBytes)} → ${formatBytes(item.bytes)}`
          : formatBytes(item.bytes),
    })),
  ];

  const handleFiles = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    const rejections = await gallery.addFiles(Array.from(fileList));
    if (rejections.length > 0) onRejected?.(rejections);
  };

  // ---- File drop ----------------------------------------------------------

  const handleDropZoneDragOver = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    if (!disabled) setIsDraggingFiles(true);
  };

  const handleDropZoneDragLeave = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDraggingFiles(false);
  };

  const handleDropZoneDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDraggingFiles(false);
    if (disabled) return;
    void handleFiles(event.dataTransfer.files);
  };

  // ---- Reordering ---------------------------------------------------------

  /**
   * Saved images and in-flight uploads live in separate ordered lists, so a
   * drag only makes sense within one of them — an upload has no position on
   * the server yet to swap into.
   */
  const applyReorder = (sourceId: string, targetId: string) => {
    if (sourceId === targetId) return;

    const source = tiles.find((tile) => tile.id === sourceId);
    const target = tiles.find((tile) => tile.id === targetId);
    if (!source || !target || source.isSaved !== target.isSaved) return;

    const ids = tiles.filter((tile) => tile.isSaved === source.isSaved).map((tile) => tile.id);
    const from = ids.indexOf(sourceId);
    const to = ids.indexOf(targetId);
    ids.splice(to, 0, ids.splice(from, 1)[0]);

    if (source.isSaved) {
      void gallery.reorderImages(ids);
    } else {
      gallery.reorderStaged(ids);
    }
  };

  /** Keyboard equivalent of a drag, so reordering is not mouse-only. */
  const nudge = (tileId: string, direction: -1 | 1) => {
    const tile = tiles.find((item) => item.id === tileId);
    if (!tile) return;
    const ids = tiles.filter((item) => item.isSaved === tile.isSaved).map((item) => item.id);
    const from = ids.indexOf(tileId);
    const to = from + direction;
    if (to < 0 || to >= ids.length) return;
    applyReorder(tileId, ids[to]);
  };

  const remaining = MAX_IMAGES_PER_PRODUCT - tiles.length;

  return (
    <section className={styles.card} aria-label="Product images">
      <header className={styles.header}>
        <h2 className={styles.title}>Product Images</h2>
        <span className={styles.counter}>
          {tiles.length}/{MAX_IMAGES_PER_PRODUCT}
        </span>
      </header>

      {tiles.length > 0 && (
        <ul className={styles.grid}>
          {tiles.map((tile, index) => (
            <li
              key={tile.id}
              className={[
                styles.tile,
                draggedId === tile.id ? styles.tileDragging : '',
                dropTargetId === tile.id ? styles.tileDropTarget : '',
                tile.error ? styles.tileError : '',
              ]
                .filter(Boolean)
                .join(' ')}
              draggable={!disabled && !tile.error}
              onDragStart={() => setDraggedId(tile.id)}
              onDragEnd={() => {
                setDraggedId(null);
                setDropTargetId(null);
              }}
              onDragOver={(event) => {
                event.preventDefault();
                if (draggedId && draggedId !== tile.id) setDropTargetId(tile.id);
              }}
              onDragLeave={() => setDropTargetId((current) => (current === tile.id ? null : current))}
              onDrop={(event) => {
                event.preventDefault();
                event.stopPropagation();
                if (draggedId) applyReorder(draggedId, tile.id);
                setDraggedId(null);
                setDropTargetId(null);
              }}
            >
              <img
                className={styles.thumb}
                src={tile.src}
                srcSet={tile.srcSet}
                alt={tile.label}
                loading="lazy"
              />

              {/* Position 0 is what every single-thumbnail view shows, so it is
                  worth calling out explicitly rather than leaving implicit. */}
              {index === 0 && tile.isSaved && (
                <span className={styles.primaryBadge}>
                  <Star size={11} /> Primary
                </span>
              )}

              {tile.progress !== null && !tile.error && (
                <div className={styles.progressOverlay}>
                  <Loader2 size={18} className={styles.spinner} />
                  <div
                    className={styles.progressTrack}
                    role="progressbar"
                    aria-valuenow={tile.progress}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label={`Uploading ${tile.label}`}
                  >
                    <span
                      className={styles.progressBar}
                      style={{ width: `${tile.progress}%` }}
                    />
                  </div>
                  <span className={styles.progressText}>{tile.progress}%</span>
                </div>
              )}

              {tile.error && (
                <div className={styles.errorOverlay}>
                  <AlertCircle size={16} />
                  <span className={styles.errorText}>{tile.error}</span>
                </div>
              )}

              <div className={styles.tileFooter}>
                <span
                  className={styles.dragHandle}
                  aria-hidden="true"
                  title="Drag to reorder"
                >
                  <GripVertical size={13} />
                </span>
                <span className={styles.caption}>{tile.caption}</span>
              </div>

              <div className={styles.tileActions}>
                <button
                  type="button"
                  className={styles.iconButton}
                  disabled={disabled || index === 0}
                  onClick={() => nudge(tile.id, -1)}
                  aria-label={`Move ${tile.label} earlier`}
                >
                  ‹
                </button>
                <button
                  type="button"
                  className={styles.iconButton}
                  disabled={disabled || index === tiles.length - 1}
                  onClick={() => nudge(tile.id, 1)}
                  aria-label={`Move ${tile.label} later`}
                >
                  ›
                </button>
                <button
                  type="button"
                  className={`${styles.iconButton} ${styles.removeButton}`}
                  disabled={disabled}
                  onClick={() =>
                    tile.isSaved
                      ? void gallery.removeImage(tile.id).catch(() => undefined)
                      : gallery.removeStaged(tile.id)
                  }
                  aria-label={`Remove ${tile.label}`}
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {gallery.canAddMore && (
        <div
          className={[styles.dropzone, isDraggingFiles ? styles.dropzoneActive : '']
            .filter(Boolean)
            .join(' ')}
          onDragOver={handleDropZoneDragOver}
          onDragLeave={handleDropZoneDragLeave}
          onDrop={handleDropZoneDrop}
          onClick={() => !disabled && inputRef.current?.click()}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault();
              inputRef.current?.click();
            }
          }}
          role="button"
          tabIndex={disabled ? -1 : 0}
          aria-label="Add product images"
          aria-disabled={disabled}
        >
          <ImagePlus className={styles.dropzoneIcon} size={26} />
          <span className={styles.dropzoneLabel}>
            Drop images here or <span className={styles.dropzoneLink}>browse</span>
          </span>
          <span className={styles.dropzoneHint}>
            JPEG, PNG, WebP, GIF or AVIF · up to {formatBytes(MAX_IMAGE_BYTES)} each ·{' '}
            {remaining} slot{remaining === 1 ? '' : 's'} left
          </span>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        className={styles.fileInput}
        accept={ACCEPTED_IMAGE_EXTENSIONS}
        multiple
        disabled={disabled}
        onChange={(event) => {
          void handleFiles(event.target.files);
          // Reset so re-picking the same file still fires a change event.
          event.target.value = '';
        }}
      />

      <p className={styles.footnote}>
        Large images are resized and compressed in your browser before upload. Drag a tile, or use
        the arrows, to reorder — the first image is used as the product thumbnail.
      </p>
    </section>
  );
};
