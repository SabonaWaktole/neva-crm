/**
 * Client-side image validation and compression for product photos.
 *
 * The server re-encodes everything to WebP anyway, so compressing here is not
 * about the stored file — it is about the upload. A 6 MB phone photo becomes
 * roughly 200 KB before it leaves the browser, which turns a slow upload on a
 * mobile connection into an instant one and makes a batch of eight images
 * practical.
 *
 * Compression is always best-effort: if the canvas pipeline fails for any
 * reason the original File is uploaded unchanged and the server handles it.
 */

/** Mirrors the server's fileFilter so bad files are rejected before upload. */
export const ACCEPTED_IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/avif',
];

export const ACCEPTED_IMAGE_EXTENSIONS = '.jpg,.jpeg,.png,.webp,.gif,.avif';

/** Keep in sync with the server's MAX_UPLOAD_BYTES. */
export const MAX_IMAGE_BYTES = 8 * 1024 * 1024;

/** Keep in sync with MAX_IMAGES_PER_PRODUCT on the server. */
export const MAX_IMAGES_PER_PRODUCT = 8;

/**
 * Longest edge kept after compression. The server renders a 1024px @2x
 * variant, so anything past 2048 is detail that gets thrown away regardless.
 */
const MAX_EDGE = 2048;

/** Below this, re-encoding tends to cost more quality than it saves bytes. */
const COMPRESSION_FLOOR_BYTES = 256 * 1024;

export const formatBytes = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
};

/**
 * Client-side guard. Catching these here means the user gets an instant answer
 * instead of waiting for an 8 MB upload to be refused — the server still
 * enforces both rules independently.
 */
export const validateImageFile = (file: File): string | null => {
  if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
    return `"${file.name}" is not a supported image. Use JPEG, PNG, WebP, GIF or AVIF.`;
  }
  if (file.size > MAX_IMAGE_BYTES) {
    return `"${file.name}" is ${formatBytes(file.size)}. The limit is ${formatBytes(
      MAX_IMAGE_BYTES
    )}.`;
  }
  return null;
};

const loadBitmap = async (file: File): Promise<ImageBitmap | HTMLImageElement> => {
  // createImageBitmap decodes off the main thread where available, so a batch
  // of large photos does not freeze the form while it is being prepared.
  if (typeof createImageBitmap === 'function') {
    return createImageBitmap(file);
  }

  const url = URL.createObjectURL(file);
  try {
    return await new Promise<HTMLImageElement>((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error('That file could not be read as an image.'));
      image.src = url;
    });
  } finally {
    URL.revokeObjectURL(url);
  }
};

export interface CompressedImage {
  /** What to upload — the compressed blob, or the original if it was left alone. */
  file: File | Blob;
  /** Size before compression, for reporting the saving. */
  originalBytes: number;
  bytes: number;
}

/**
 * Downscales to `MAX_EDGE` and re-encodes as WebP.
 *
 * Animated GIFs are passed straight through: drawing one to a canvas keeps
 * only the first frame, which would silently destroy the image.
 */
export const compressImage = async (file: File): Promise<CompressedImage> => {
  const untouched: CompressedImage = {
    file,
    originalBytes: file.size,
    bytes: file.size,
  };

  if (file.type === 'image/gif') return untouched;
  if (file.size <= COMPRESSION_FLOOR_BYTES) return untouched;

  try {
    const source = await loadBitmap(file);
    const width = 'width' in source ? source.width : 0;
    const height = 'height' in source ? source.height : 0;
    if (!width || !height) return untouched;

    const scale = Math.min(1, MAX_EDGE / Math.max(width, height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(width * scale);
    canvas.height = Math.round(height * scale);

    const context = canvas.getContext('2d');
    if (!context) return untouched;
    context.drawImage(source as CanvasImageSource, 0, 0, canvas.width, canvas.height);

    if ('close' in source && typeof source.close === 'function') source.close();

    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob(resolve, 'image/webp', 0.85);
    });

    // Re-encoding can enlarge an already-optimised file; keep whichever wins.
    if (!blob || blob.size >= file.size) return untouched;

    const name = file.name.replace(/\.[^.]+$/, '') || 'image';
    return {
      file: new File([blob], `${name}.webp`, { type: 'image/webp' }),
      originalBytes: file.size,
      bytes: blob.size,
    };
  } catch {
    // Never block an upload because compression failed.
    return untouched;
  }
};
