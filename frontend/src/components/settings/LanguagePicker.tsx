import React from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { SUPPORTED_LANGUAGES, LANGUAGE_LABELS, type Language } from '../../i18n/config';
import { REVIEWED_LANGUAGES } from '../../i18n/reviewStatus';
import styles from './LanguagePicker.module.css';

interface LanguagePickerProps {
  id: string;
  value: Language | '';
  onChange: (value: Language | '') => void;
  disabled?: boolean;
  /**
   * Adds a "follow the workspace default" option. Used by the personal
   * preference, not by the workspace default itself — a workspace has nothing
   * to defer to.
   */
  inheritOption?: { label: string };
}

/**
 * Language selector, shared by the workspace default and the personal override.
 *
 * A language whose catalogue has not been reviewed by a native speaker is
 * labelled as such, in the option text itself rather than only in a footnote —
 * an option someone might never scroll past. Presenting an unreviewed
 * translation as an equal-footing choice would mislead the person least able to
 * detect the problem: the one who cannot read the other language.
 */
export const LanguagePicker: React.FC<LanguagePickerProps> = ({
  id,
  value,
  onChange,
  disabled,
  inheritOption,
}) => {
  const { t } = useTranslation('common');
  const unreviewed = SUPPORTED_LANGUAGES.filter((code) => !REVIEWED_LANGUAGES.includes(code));

  return (
    <>
      <select
        id={id}
        className={styles.select}
        value={value}
        onChange={(event) => onChange(event.target.value as Language | '')}
        disabled={disabled}
      >
        {inheritOption && <option value="">{inheritOption.label}</option>}
        {SUPPORTED_LANGUAGES.map((code) => (
          <option key={code} value={code}>
            {LANGUAGE_LABELS[code]}
            {REVIEWED_LANGUAGES.includes(code) ? '' : ` — ${t('language.inReview')}`}
          </option>
        ))}
      </select>

      {unreviewed.length > 0 && (
        <p className={styles.reviewNotice}>
          {/*
            One key per plural rather than an inline "is"/"are": the sentence
            differs by more than a verb in most languages, and splicing English
            grammar together from fragments is exactly what does not survive
            translation.
          */}
          <Trans
            t={t}
            i18nKey={unreviewed.length === 1 ? 'language.reviewNoticeOne' : 'language.reviewNoticeOther'}
            values={{ languages: unreviewed.map((code) => LANGUAGE_LABELS[code]).join(', ') }}
            components={[<strong key="languages" />]}
          />
        </p>
      )}
    </>
  );
};
