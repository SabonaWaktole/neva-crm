import { forwardRef, useId } from 'react';
import type { TextareaHTMLAttributes } from 'react';
import styles from './TextareaInput.module.css';

export interface TextareaInputProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  helperText?: string;
  error?: string;
}

export const TextareaInput = forwardRef<HTMLTextAreaElement, TextareaInputProps>(
  ({ label, helperText, error, className = '', id, required, ...props }, ref) => {
    // useId is stable across renders, unlike a random id regenerated each time.
    const generatedId = useId();
    const inputId = id || generatedId;
    const messageId = `${inputId}-message`;
    const message = error || helperText;

    const inputClasses = [styles.input, error ? styles.inputError : '']
      .filter(Boolean)
      .join(' ');

    return (
      <div className={`${styles.container} ${className}`}>
        {label && (
          <label htmlFor={inputId} className={styles.label}>
            {label}
            {required && (
              <span className={styles.required} aria-hidden="true">
                *
              </span>
            )}
          </label>
        )}
        <div className={styles.inputWrapper}>
          <textarea
            ref={ref}
            id={inputId}
            className={inputClasses}
            required={required}
            aria-invalid={error ? true : undefined}
            aria-describedby={message ? messageId : undefined}
            {...props}
          />
        </div>
        {message && (
          <p
            id={messageId}
            className={`${styles.helperText} ${error ? styles.helperTextError : ''}`}
            role={error ? 'alert' : undefined}
          >
            {message}
          </p>
        )}
      </div>
    );
  }
);

TextareaInput.displayName = 'TextareaInput';
