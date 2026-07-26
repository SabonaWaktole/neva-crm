import { useMemo } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { dayKeyInZone, isSameDayInZone } from '../utils/tenantDay';

/**
 * Date and time formatting bound to the workspace's settings.
 *
 * Two distinct settings feed this, and conflating them is the mistake to avoid:
 *
 *   - `tenantTimezone` decides WHICH DAY an instant falls on. It is a
 *     correctness concern: get it wrong and an appointment appears on the wrong
 *     date, or a dashboard count disagrees with the calendar.
 *   - `tenantLocale` decides HOW that date is written (order, separators,
 *     month names). Purely presentational.
 *
 * Neither is the UI language. A user reading the interface in Albanian still
 * sees dates in their workspace's configured conventions — see the regression
 * test in i18n/orthogonality.test.tsx.
 *
 * `dateFormat` (MM/DD/YYYY etc.) is deliberately NOT consumed here: `Intl` with
 * a locale already produces the right ordering, and layering an explicit
 * pattern on top would let the two disagree. The setting is surfaced for a
 * future explicit-pattern mode; until then the locale governs. See TD-012.
 */
export const FALLBACK_TIMEZONE = 'UTC';
export const FALLBACK_LOCALE = 'en-US';

const cache = new Map<string, Intl.DateTimeFormat>();

const formatter = (
  locale: string,
  timeZone: string,
  options: Intl.DateTimeFormatOptions
): Intl.DateTimeFormat => {
  const key = `${locale}|${timeZone}|${JSON.stringify(options)}`;
  const cached = cache.get(key);
  if (cached) return cached;

  const made = new Intl.DateTimeFormat(locale, { ...options, timeZone });
  cache.set(key, made);
  return made;
};

type DateInput = Date | string | number;

const toDate = (value: DateInput): Date =>
  value instanceof Date ? value : new Date(value);

export function useDateFormat() {
  const timeZone = useAuthStore((state) => state.user?.tenantTimezone) ?? FALLBACK_TIMEZONE;
  const locale = useAuthStore((state) => state.user?.tenantLocale) ?? FALLBACK_LOCALE;

  return useMemo(
    () => ({
      timeZone,
      locale,

      /** Short calendar date, e.g. 27/07/2026. */
      date: (value: DateInput) =>
        formatter(locale, timeZone, { dateStyle: 'short' }).format(toDate(value)),

      /** Date with a written month, for detail views. */
      dateMedium: (value: DateInput) =>
        formatter(locale, timeZone, { dateStyle: 'medium' }).format(toDate(value)),

      /** Time of day only. */
      time: (value: DateInput) =>
        formatter(locale, timeZone, { hour: '2-digit', minute: '2-digit' }).format(toDate(value)),

      /** Date and time together, for timeline entries and audit rows. */
      dateTime: (value: DateInput) =>
        formatter(locale, timeZone, { dateStyle: 'medium', timeStyle: 'short' }).format(
          toDate(value)
        ),

      /** Arbitrary options, still pinned to the tenant's zone and locale. */
      custom: (value: DateInput, options: Intl.DateTimeFormatOptions) =>
        formatter(locale, timeZone, options).format(toDate(value)),

      /** Grouping helpers, so callers never reach for browser-local dates. */
      dayKey: (value: DateInput) => dayKeyInZone(toDate(value), timeZone),
      isSameDay: (a: DateInput, b: DateInput) => isSameDayInZone(toDate(a), toDate(b), timeZone),
    }),
    [locale, timeZone]
  );
}
