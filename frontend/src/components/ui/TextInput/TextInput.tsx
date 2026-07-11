import React, { InputHTMLAttributes, ReactNode, forwardRef } from 'react';
import styles from './TextInput.module.css';

export interface TextInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helperText?: string;
  error?: string;
  iconLeft?: ReactNode;
  iconRight?: ReactNode;
  onIconRightClick?: () => void;
}

export const TextInput = forwardRef<HTMLInputElement, TextInputProps>(
  (
    { label, helperText, error, iconLeft, iconRight, onIconRightClick, className = '', id, ...props },
    ref
  ) => {
    // Generate a unique ID if none provided, to link label and input
    const inputId = id || `input-${Math.random().toString(36).substring(2, 9)}`;

    const inputClasses = [
      styles.input,
      error ? styles.inputError : '',
      iconLeft ? styles.hasIconLeft : '',
      iconRight ? styles.hasIconRight : '',
    ]
      .filter(Boolean)
      .join(' ');

    return (
      <div className={`${styles.container} ${className}`}>
        {label && (
          <label htmlFor={inputId} className={styles.label}>
            {label}
          </label>
        )}
        <div className={styles.inputWrapper}>
          {iconLeft && (
            <div className={`${styles.iconWrapper} ${styles.iconLeft}`}>
              {iconLeft}
            </div>
          )}
          
          <input
            ref={ref}
            id={inputId}
            className={inputClasses}
            {...props}
          />
          
          {iconRight && (
            <div className={`${styles.iconWrapper} ${styles.iconRight}`}>
              {onIconRightClick ? (
                <button
                  type="button"
                  className={styles.iconButton}
                  onClick={onIconRightClick}
                  tabIndex={-1}
                >
                  {iconRight}
                </button>
              ) : (
                iconRight
              )}
            </div>
          )}
        </div>
        
        {(error || helperText) && (
          <p className={`${styles.helperText} ${error ? styles.helperTextError : ''}`}>
            {error || helperText}
          </p>
        )}
      </div>
    );
  }
);

TextInput.displayName = 'TextInput';
