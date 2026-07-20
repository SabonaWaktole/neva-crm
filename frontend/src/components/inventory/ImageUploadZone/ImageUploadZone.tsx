import React, { useState } from 'react';
import type { DragEvent } from 'react';
import { ImagePlus } from 'lucide-react';
import styles from './ImageUploadZone.module.css';

export interface ImageUploadZoneProps {
  className?: string;
}

export const ImageUploadZone: React.FC<ImageUploadZoneProps> = ({ className = '' }) => {
  const [isDragging, setIsDragging] = useState(false);

  /* NOT WIRED — no backend image storage exists yet */

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isDragging) {
      setIsDragging(true);
    }
  };

  const handleDragEnter = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const wrapperClasses = [styles.wrapper, className].filter(Boolean).join(' ');
  const dropzoneClasses = [
    styles.dropzone,
    isDragging ? styles.dropzoneDragging : ''
  ].filter(Boolean).join(' ');

  return (
    <div className={wrapperClasses}>
      <div
        className={dropzoneClasses}
        onDragOver={handleDragOver}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        role="button"
        tabIndex={0}
        aria-label="Upload Hero Image"
      >
        <ImagePlus className={styles.icon} size={40} />
        <span className={styles.label}>Upload Hero Image</span>
      </div>
      <p className={styles.hint}>High-fidelity renders preferred</p>
    </div>
  );
};
