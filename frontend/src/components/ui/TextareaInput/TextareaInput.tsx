import { forwardRef } from 'react';
import type { TextareaHTMLAttributes } from 'react';
import styles from './TextareaInput.module.css';

export interface TextareaInputProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  helperText?: string;
  error?: string;
}

export const TextareaInput = forwardRef<HTMLTextAreaElement, TextareaInputProps>(
  ({ label, helperText, error, className = '', id, ...props }, ref) => {
    // Generate a unique ID if none provided, to link label and textarea
    const inputId = id || `textarea-${Math.random().toString(36).substring(2, 9)}`;

    const inputClasses = [
      styles.input,
      error ? styles.inputError : '',
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
          <textarea
            ref={ref}
            id={inputId}
            className={inputClasses}
            {...props}
          />
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

TextareaInput.displayName = 'TextareaInput';
