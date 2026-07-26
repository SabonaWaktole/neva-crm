import React, { useId, useRef, useState } from 'react';
import type { KeyboardEvent } from 'react';
import { X } from 'lucide-react';
import styles from './TagInput.module.css';

export interface TagInputProps {
  label?: string;
  value: string[];
  onChange: (tags: string[]) => void;
  /** Existing vocabulary offered as a datalist. */
  suggestions?: string[];
  placeholder?: string;
  helperText?: string;
  error?: string;
  maxTags?: number;
  /** Matches the server's per-tag length cap. */
  maxTagLength?: number;
  disabled?: boolean;
}

/**
 * Free-text tags entered one at a time.
 *
 * Enter and comma both commit, because people type both; backspace on an empty
 * field removes the last tag, which is the convention every other tag input
 * has trained users to expect.
 */
export const TagInput: React.FC<TagInputProps> = ({
  label,
  value,
  onChange,
  suggestions = [],
  placeholder = 'Add a tag…',
  helperText,
  error,
  maxTags = 20,
  maxTagLength = 32,
  disabled = false,
}) => {
  const inputId = useId();
  const listId = `${inputId}-suggestions`;
  const inputRef = useRef<HTMLInputElement>(null);
  const [draft, setDraft] = useState('');

  const commit = (raw: string) => {
    const tag = raw.trim().slice(0, maxTagLength);
    if (!tag) return;
    // Case-insensitive duplicate check, so "Summer" and "summer" don't both land.
    const exists = value.some((existing) => existing.toLowerCase() === tag.toLowerCase());
    if (exists || value.length >= maxTags) {
      setDraft('');
      return;
    }
    onChange([...value, tag]);
    setDraft('');
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' || event.key === ',') {
      // Enter inside a form would otherwise submit it.
      event.preventDefault();
      commit(draft);
      return;
    }
    if (event.key === 'Backspace' && draft === '' && value.length > 0) {
      onChange(value.slice(0, -1));
    }
  };

  const remove = (tag: string) => onChange(value.filter((item) => item !== tag));

  const unusedSuggestions = suggestions.filter(
    (suggestion) => !value.some((tag) => tag.toLowerCase() === suggestion.toLowerCase())
  );

  const message = error || helperText;

  return (
    <div className={styles.container}>
      {label && (
        <label htmlFor={inputId} className={styles.label}>
          {label}
        </label>
      )}

      <div
        className={[styles.field, error ? styles.fieldError : '', disabled ? styles.fieldDisabled : '']
          .filter(Boolean)
          .join(' ')}
        onClick={() => inputRef.current?.focus()}
      >
        {value.map((tag) => (
          <span key={tag} className={styles.tag}>
            {tag}
            <button
              type="button"
              className={styles.tagRemove}
              onClick={(event) => {
                event.stopPropagation();
                remove(tag);
              }}
              disabled={disabled}
              aria-label={`Remove tag ${tag}`}
            >
              <X size={12} />
            </button>
          </span>
        ))}

        <input
          ref={inputRef}
          id={inputId}
          className={styles.input}
          list={unusedSuggestions.length > 0 ? listId : undefined}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={handleKeyDown}
          // Committing on blur means a typed-but-unconfirmed tag is not lost
          // when the user tabs straight to Save.
          onBlur={() => commit(draft)}
          placeholder={value.length >= maxTags ? `Limit of ${maxTags} tags reached` : placeholder}
          disabled={disabled || value.length >= maxTags}
          maxLength={maxTagLength}
          aria-invalid={error ? true : undefined}
          aria-describedby={message ? `${inputId}-message` : undefined}
        />

        {unusedSuggestions.length > 0 && (
          <datalist id={listId}>
            {unusedSuggestions.map((suggestion) => (
              <option key={suggestion} value={suggestion} />
            ))}
          </datalist>
        )}
      </div>

      {message && (
        <p
          id={`${inputId}-message`}
          className={`${styles.helperText} ${error ? styles.helperTextError : ''}`}
          role={error ? 'alert' : undefined}
        >
          {message}
        </p>
      )}
    </div>
  );
};
