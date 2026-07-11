import React, { ImgHTMLAttributes } from 'react';
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
  const classNames = [
    styles.avatar,
    styles[`size-${size}`],
    withBorder ? styles.withBorder : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  if (!src && fallback) {
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
      {...props}
    />
  );
};
