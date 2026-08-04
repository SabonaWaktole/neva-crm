import type { Language } from './config';

/**
 * Languages whose catalogue has been reviewed by a native speaker.
 *
 * This is the single source of truth for whether a language may be presented as
 * production-ready. It is deliberately a code constant rather than a comment or
 * a wiki page: the settings UI reads it directly, so a language cannot be
 * quietly promoted without this list changing, and the change is visible in a
 * diff.
 *
 * Albanian, Greek and Italian are absent on purpose. Their catalogues are
 * structurally complete — correct keys, interpolation and plural rules, 100%
 * of the English keys — but the wording has not been checked by a speaker, and
 * business vocabulary (quotation, stock level, warehouse, lead) is where a
 * plausible-looking wrong term is most likely and least likely to be noticed.
 *
 * Adding any of them here requires: a native review of the strings, the
 * reviewed key paths recorded in locales/<lang>/.reviewed.json, and
 * `node scripts/check-translations.mjs --strict` passing. See TD-019.
 */
export const REVIEWED_LANGUAGES: readonly Language[] = ['en'];

export const isReviewed = (language: Language): boolean =>
  REVIEWED_LANGUAGES.includes(language);
