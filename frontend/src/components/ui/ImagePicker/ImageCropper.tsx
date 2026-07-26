import { useCallback, useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { RotateCcw, ZoomIn } from 'lucide-react';
import { Button } from '../Button/Button';
import styles from './ImageCropper.module.css';

/**
 * Pan-and-zoom cropper.
 *
 * Built on a canvas rather than a cropping library: the interaction is only
 * drag + zoom, and rolling it by hand keeps the bundle lean and lets the
 * control surface match the rest of the design system exactly.
 *
 * The preview is a CSS transform on an <img> — cheap and smooth — and the same
 * transform is replayed onto a canvas at export time, so what the user frames
 * is exactly what gets uploaded.
 */

export interface CropAspect {
  /** Output pixel dimensions handed to the canvas. */
  width: number;
  height: number;
  /** Circular mask for avatars; the export is still a square image. */
  round?: boolean;
}

interface ImageCropperProps {
  file: File;
  aspect: CropAspect;
  onCancel: () => void;
  onConfirm: (blob: Blob) => void;
  isBusy?: boolean;
  confirmLabel?: string;
}

const MIN_ZOOM = 1;
const MAX_ZOOM = 4;

export const ImageCropper: React.FC<ImageCropperProps> = ({
  file,
  aspect,
  onCancel,
  onConfirm,
  isBusy = false,
  confirmLabel = 'Save',
}) => {
  const [objectUrl, setObjectUrl] = useState<string | null>(null);
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  const viewportRef = useRef<HTMLDivElement>(null);
  const dragState = useRef<{ startX: number; startY: number; originX: number; originY: number } | null>(
    null
  );

  // Object URLs are revoked on unmount/refile — leaking them pins the whole
  // decoded bitmap in memory.
  useEffect(() => {
    const url = URL.createObjectURL(file);
    setObjectUrl(url);

    const img = new Image();
    img.onload = () => setImage(img);
    img.src = url;

    return () => URL.revokeObjectURL(url);
  }, [file]);

  // Reset framing whenever a different file arrives.
  useEffect(() => {
    setZoom(1);
    setOffset({ x: 0, y: 0 });
  }, [file]);

  /** Scale at which the image exactly covers the viewport. */
  const coverScale = useCallback(() => {
    const viewport = viewportRef.current;
    if (!viewport || !image) return 1;
    const { clientWidth: vw, clientHeight: vh } = viewport;
    return Math.max(vw / image.naturalWidth, vh / image.naturalHeight);
  }, [image]);

  /** Keeps the image covering the viewport so no empty gutter can appear. */
  const clampOffset = useCallback(
    (next: { x: number; y: number }, atZoom: number) => {
      const viewport = viewportRef.current;
      if (!viewport || !image) return next;
      const scale = coverScale() * atZoom;
      const maxX = Math.max(0, (image.naturalWidth * scale - viewport.clientWidth) / 2);
      const maxY = Math.max(0, (image.naturalHeight * scale - viewport.clientHeight) / 2);
      return {
        x: Math.min(maxX, Math.max(-maxX, next.x)),
        y: Math.min(maxY, Math.max(-maxY, next.y)),
      };
    },
    [image, coverScale]
  );

  const handlePointerDown = (event: React.PointerEvent) => {
    if (!image) return;
    (event.target as HTMLElement).setPointerCapture(event.pointerId);
    dragState.current = {
      startX: event.clientX,
      startY: event.clientY,
      originX: offset.x,
      originY: offset.y,
    };
  };

  const handlePointerMove = (event: React.PointerEvent) => {
    const drag = dragState.current;
    if (!drag) return;
    setOffset(
      clampOffset(
        {
          x: drag.originX + (event.clientX - drag.startX),
          y: drag.originY + (event.clientY - drag.startY),
        },
        zoom
      )
    );
  };

  const endDrag = (event: React.PointerEvent) => {
    if (dragState.current) {
      (event.target as HTMLElement).releasePointerCapture?.(event.pointerId);
    }
    dragState.current = null;
  };

  const applyZoom = (next: number) => {
    const clamped = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, next));
    setZoom(clamped);
    // Re-clamp: zooming out can leave the image off-centre enough to expose a gap.
    setOffset((current) => clampOffset(current, clamped));
  };

  const handleWheel = (event: React.WheelEvent) => {
    if (!image) return;
    applyZoom(zoom - event.deltaY * 0.002);
  };

  const reset = () => {
    setZoom(1);
    setOffset({ x: 0, y: 0 });
  };

  /** Replays the on-screen transform onto a canvas at the target resolution. */
  const handleConfirm = () => {
    const viewport = viewportRef.current;
    if (!viewport || !image) return;

    const scale = coverScale() * zoom;
    // Portion of the source image currently framed by the viewport.
    const sourceW = viewport.clientWidth / scale;
    const sourceH = viewport.clientHeight / scale;
    const centreX = image.naturalWidth / 2 - offset.x / scale;
    const centreY = image.naturalHeight / 2 - offset.y / scale;

    const canvas = document.createElement('canvas');
    canvas.width = aspect.width;
    canvas.height = aspect.height;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(
      image,
      centreX - sourceW / 2,
      centreY - sourceH / 2,
      sourceW,
      sourceH,
      0,
      0,
      aspect.width,
      aspect.height
    );

    // PNG keeps the crop lossless; the server re-encodes to WebP anyway, so
    // compressing twice would only compound artefacts.
    canvas.toBlob((blob) => {
      if (blob) onConfirm(blob);
    }, 'image/png');
  };

  return (
    <div className={styles.cropper}>
      <div
        ref={viewportRef}
        className={`${styles.viewport} ${aspect.round ? styles.viewportRound : ''}`}
        style={{ aspectRatio: `${aspect.width} / ${aspect.height}` }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onWheel={handleWheel}
      >
        {objectUrl && (
          <img
            src={objectUrl}
            alt=""
            className={styles.image}
            draggable={false}
            style={{
              transform: `translate(-50%, -50%) translate(${offset.x}px, ${offset.y}px) scale(${
                coverScale() * zoom
              })`,
            }}
          />
        )}
        <div className={styles.grid} aria-hidden="true" />
      </div>

      <div className={styles.controls}>
        <ZoomIn size={16} className={styles.zoomIcon} />
        <input
          type="range"
          className={styles.slider}
          min={MIN_ZOOM}
          max={MAX_ZOOM}
          step={0.01}
          value={zoom}
          onChange={(event) => applyZoom(Number(event.target.value))}
          aria-label="Zoom"
        />
        <motion.button
          type="button"
          className={styles.resetButton}
          onClick={reset}
          whileTap={{ scale: 0.94 }}
          aria-label="Reset framing"
        >
          <RotateCcw size={15} />
        </motion.button>
      </div>

      <p className={styles.hint}>Drag to reposition · scroll or use the slider to zoom</p>

      <div className={styles.actions}>
        <Button variant="ghost" onClick={onCancel} disabled={isBusy}>
          Cancel
        </Button>
        <Button variant="primary" onClick={handleConfirm} isLoading={isBusy}>
          {confirmLabel}
        </Button>
      </div>
    </div>
  );
};
