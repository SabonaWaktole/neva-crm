import React, { useEffect, useState } from 'react';
import type { ImgHTMLAttributes } from 'react';
import styles from './Avatar.module.css';

export interface AvatarProps extends ImgHTMLAttributes<HTMLImageElement> {
  size?: 'sm' | 'md' | 'lg';
  withBorder?: boolean;
  fallback?: string;
}

export const Avatar: React.FC<AvatarProps> = ({
  size = 'md',
  withBorder = false,
  fallback,
  className = '',
  alt,
  src,
  ...props
}) => {
  // Avatars point at user-uploaded files, which can 404 — an image removed in
  // another tab, or a stale URL. Falling back to initials keeps a broken-image
  // icon from ever reaching the UI.
  const [hasErrored, setHasErrored] = useState(false);

  // A new src deserves a fresh attempt.
  useEffect(() => {
    setHasErrored(false);
  }, [src]);

  const classNames = [
    styles.avatar,
    styles[`size-${size}`],
    withBorder ? styles.withBorder : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  if ((!src || hasErrored) && fallback) {
    return (
      <div className={classNames} aria-label={alt}>
        {fallback}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt || 'Avatar'}
      className={classNames}
      onError={() => setHasErrored(true)}
      {...props}
    />
  );
};
