import { useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertCircle, Check, ImagePlus, Trash2, Upload } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Modal } from '../Modal/Modal';
import {
  ACCEPTED_EXTENSIONS,
  mediaService,
  resolveMediaUrl,
  srcSetFor,
  validateImage,
} from '../../../services/mediaService';
import type { MediaKind } from '../../../services/mediaService';
import { ImageCropper, type CropAspect } from './ImageCropper';
import styles from './ImagePicker.module.css';

/**
 * Upload/replace/remove control for one image slot.
 *
 * Owns the whole flow — drop or browse, validate, crop, upload with progress,
 * report failure — and reports the resulting URL upward via `onChange`. The
 * parent only stores a string.
 */

/** Output geometry per kind. Mirrors MEDIA_SPECS on the server. */
const CROP_SPECS: Record<MediaKind, CropAspect> = {
  logo: { width: 512, height: 512 },
  avatar: { width: 512, height: 512, round: true },
  'company-cover': { width: 3200, height: 800 },
  'user-cover': { width: 3200, height: 800 },
};

export interface ImagePickerProps {
  kind: MediaKind;
  tenantSlug: string;
  /** Current stored URL, or null when nothing is set. */
  value: string | null;
  onChange: (url: string | null) => void;
  /** Visual treatment: a small square/circle tile, or a wide banner. */
  variant?: 'tile' | 'banner';
  label?: string;
  hint?: string;
  disabled?: boolean;
}

export const ImagePicker: React.FC<ImagePickerProps> = ({
  kind,
  tenantSlug,
  value,
  onChange,
  variant = 'tile',
  label,
  hint,
  disabled = false,
}) => {
  const { t } = useTranslation('common');
  const inputRef = useRef<HTMLInputElement>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [justSaved, setJustSaved] = useState(false);

  const spec = CROP_SPECS[kind];
  const isRound = Boolean(spec.round);
  const isBusy = progress !== null;
  const resolved = resolveMediaUrl(value);

  const acceptFile = (file: File | undefined | null) => {
    if (!file || disabled) return;
    const problem = validateImage(file);
    if (problem) {
      setError(problem);
      return;
    }
    setError(null);
    setPendingFile(file);
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    setIsDragging(false);
    acceptFile(event.dataTransfer.files?.[0]);
  };

  const handleUpload = async (blob: Blob) => {
    setProgress(0);
    setError(null);
    try {
      const result = await mediaService.upload(tenantSlug, kind, blob, setProgress);
      onChange(result.url);
      setPendingFile(null);
      // Brief confirmation tick, then back to the resting state.
      setJustSaved(true);
      window.setTimeout(() => setJustSaved(false), 1800);
    } catch (uploadError: any) {
      setError(uploadError?.message ?? t('media.uploadFailed'));
    } finally {
      setProgress(null);
    }
  };

  const handleRemove = async () => {
    if (disabled || !value) return;
    setError(null);
    setProgress(0);
    try {
      await mediaService.remove(tenantSlug, kind);
      onChange(null);
    } catch (removeError: any) {
      setError(removeError?.message ?? t('media.removeFailed'));
    } finally {
      setProgress(null);
    }
  };

  return (
    <div className={styles.wrapper}>
      {label && <span className={styles.label}>{label}</span>}

      <div className={styles.row}>
        <div
          className={[
            styles.dropzone,
            variant === 'banner' ? styles.dropzoneBanner : styles.dropzoneTile,
            isRound ? styles.dropzoneRound : '',
            isDragging ? styles.dropzoneDragging : '',
            disabled ? styles.dropzoneDisabled : '',
          ]
            .filter(Boolean)
            .join(' ')}
          onDragOver={(event) => {
            event.preventDefault();
            if (!disabled) setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => !disabled && !isBusy && inputRef.current?.click()}
          role="button"
          tabIndex={disabled ? -1 : 0}
          aria-label={`${value ? t('media.replace') : t('media.upload')} ${label ?? kind}`}
          aria-busy={isBusy}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault();
              if (!disabled && !isBusy) inputRef.current?.click();
            }
          }}
        >
          {resolved ? (
            <img
              className={styles.preview}
              src={resolved}
              srcSet={srcSetFor(value)}
              alt={label ?? kind}
              loading="lazy"
            />
          ) : (
            <div className={styles.empty}>
              <ImagePlus size={variant === 'banner' ? 22 : 20} strokeWidth={1.5} />
              {variant === 'banner' && <span>{t('media.dropHint')}</span>}
            </div>
          )}

          {/* Hover affordance — only meaningful on pointer devices. */}
          {!disabled && !isBusy && (
            <div className={styles.overlay}>
              <Upload size={18} />
              <span>{value ? t('media.replace') : t('media.upload')}</span>
            </div>
          )}

          <AnimatePresence>
            {isBusy && (
              <motion.div
                className={styles.progressOverlay}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <div className={styles.progressTrack}>
                  <motion.div
                    className={styles.progressFill}
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: (progress ?? 0) / 100 }}
                    transition={{ ease: 'easeOut', duration: 0.25 }}
                  />
                </div>
                <span className={styles.progressLabel}>{progress}%</span>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {justSaved && (
              <motion.div
                className={styles.savedBadge}
                initial={{ opacity: 0, scale: 0.6 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ type: 'spring', stiffness: 400, damping: 22 }}
              >
                <Check size={14} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className={styles.side}>
          {hint && <p className={styles.hint}>{hint}</p>}
          <div className={styles.sideActions}>
            <button
              type="button"
              className={styles.linkButton}
              onClick={() => inputRef.current?.click()}
              disabled={disabled || isBusy}
            >
              {value ? t('media.replace') : t('media.upload')}
            </button>
            {value && (
              <button
                type="button"
                className={`${styles.linkButton} ${styles.linkDanger}`}
                onClick={handleRemove}
                disabled={disabled || isBusy}
              >
                <Trash2 size={13} />
                {t('actions.remove')}
              </button>
            )}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {error && (
          <motion.p
            className={styles.error}
            role="alert"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
          >
            <AlertCircle size={14} />
            {error}
          </motion.p>
        )}
      </AnimatePresence>

      <input
        ref={inputRef}
        type="file"
        className={styles.fileInput}
        accept={ACCEPTED_EXTENSIONS}
        onChange={(event) => {
          acceptFile(event.target.files?.[0]);
          // Reset so picking the same file twice still fires a change event.
          event.target.value = '';
        }}
        tabIndex={-1}
        aria-hidden="true"
      />

      <Modal
        isOpen={Boolean(pendingFile)}
        onClose={() => !isBusy && setPendingFile(null)}
        title={t('media.positionTitle')}
        maxWidth={variant === 'banner' ? 'lg' : 'md'}
      >
        {pendingFile && (
          <ImageCropper
            file={pendingFile}
            aspect={spec}
            isBusy={isBusy}
            onCancel={() => setPendingFile(null)}
            onConfirm={handleUpload}
            confirmLabel={isBusy ? t('media.uploading') : t('media.saveImage')}
          />
        )}
      </Modal>
    </div>
  );
};
