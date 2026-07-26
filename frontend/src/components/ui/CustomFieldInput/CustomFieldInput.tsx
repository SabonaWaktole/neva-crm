import React, { forwardRef } from 'react';
import { TextInput } from '../TextInput/TextInput';
import { SelectInput } from '../SelectInput/SelectInput';
import { TextareaInput } from '../TextareaInput/TextareaInput';
import styles from './CustomFieldInput.module.css';
import { useTranslation } from 'react-i18next';

export interface CustomFieldInputProps {
  fieldType: 'text' | 'multiline' | 'number' | 'dropdown' | 'date' | 'checkbox';
  label: string;
  options?: string[];
  value: any;
  onChange: (value: any) => void;
  error?: string;
  required?: boolean;
  className?: string;
}

export const CustomFieldInput = forwardRef<HTMLElement, CustomFieldInputProps>(
  (
    { fieldType, label, options = [], value, onChange, error, required, className = '' },
    ref
  ) => {
    const { t } = useTranslation('common');
    switch (fieldType) {
      case 'text':
      case 'number':
      case 'date':
        return (
          <TextInput
            ref={ref as React.Ref<HTMLInputElement>}
            type={fieldType}
            label={label}
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            error={error}
            required={required}
            className={className}
          />
        );
      case 'multiline':
        return (
          <TextareaInput
            ref={ref as React.Ref<HTMLTextAreaElement>}
            label={label}
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            error={error}
            required={required}
            className={className}
          />
        );
      case 'dropdown':
        return (
          <SelectInput
            ref={ref as React.Ref<HTMLSelectElement>}
            label={label}
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            error={error}
            required={required}
            className={className}
          >
            <option value="" disabled>{t('input.selectAnOption')}</option>
            {options.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </SelectInput>
        );
      case 'checkbox':
        return (
          <div className={`${styles.checkboxContainer} ${className}`}>
            <label className={styles.checkboxLabel}>
              <input
                ref={ref as React.Ref<HTMLInputElement>}
                type="checkbox"
                className={styles.checkboxInput}
                checked={!!value}
                onChange={(e) => onChange(e.target.checked)}
                required={required}
              />
              <span className={styles.checkboxText}>{label}</span>
            </label>
            {error && <p className={styles.helperTextError}>{error}</p>}
          </div>
        );
      default:
        return null;
    }
  }
);

CustomFieldInput.displayName = 'CustomFieldInput';
