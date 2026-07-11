import { forwardRef } from 'react';
import type { ReactNode, SelectHTMLAttributes } from 'react';
import { ChevronDown } from 'lucide-react';
import styles from './SelectInput.module.css';

export interface SelectInputProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  helperText?: string;
  error?: string;
  iconLeft?: ReactNode;
}

export const SelectInput = forwardRef<HTMLSelectElement, SelectInputProps>(
  ({ label, helperText, error, iconLeft, children, id, className = '', ...props }, ref) => {
    // Generate a unique ID if none provided, to link label and input
    const inputId = id || `select-${Math.random().toString(36).substring(2, 9)}`;

    const inputClasses = [
      styles.input,
      error ? styles.inputError : '',
      iconLeft ? styles.hasIconLeft : '',
      styles.hasIconRight, // Always have right space for ChevronDown
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
          
          <select
            ref={ref}
            id={inputId}
            className={inputClasses}
            {...props}
          >
            {children}
          </select>
          
          <div className={`${styles.iconWrapper} ${styles.iconRight} ${styles.pointerEventsNone}`}>
            <ChevronDown size={16} />
          </div>
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

SelectInput.displayName = 'SelectInput';
