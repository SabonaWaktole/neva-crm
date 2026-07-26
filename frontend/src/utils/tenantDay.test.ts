import { describe, it, expect } from 'vitest';
import { dayKeyInZone, isSameDayInZone } from './tenantDay';

/**
 * ===========================================================================
 * SHARED FIXTURE — MUST MATCH `backend/tests/unit/shared/tenantDay.test.ts`
 * EXACTLY.
 *
 * The two packages cannot import a common module, so the day definition is
 * duplicated. This table is the contract between the copies: if either side's
 * logic drifts, its suite fails here.
 *
 * Copy the table verbatim when adding cases; do not "improve" it on one side.
 * ===========================================================================
 */
export const TIMEZONE_DAY_FIXTURES: Array<{
  name: string;
  instant: string;
  timeZone: string;
  expectedDay: string;
}> = [
  // The exact case that was broken in production: server on UTC+3, user on
  // UTC+2, appointment at 21:30Z. The two disagreed about the date.
  { name: 'late evening UTC, Addis (UTC+3) has rolled over',
    instant: '2026-07-27T21:30:00.000Z', timeZone: 'Africa/Addis_Ababa', expectedDay: '2026-07-28' },
  { name: 'same instant, Tirane (UTC+2) has not',
    instant: '2026-07-27T21:30:00.000Z', timeZone: 'Europe/Tirane', expectedDay: '2026-07-27' },
  { name: 'same instant in UTC itself',
    instant: '2026-07-27T21:30:00.000Z', timeZone: 'UTC', expectedDay: '2026-07-27' },

  // Behind UTC: the previous day locally while UTC has already turned over.
  { name: 'just after UTC midnight, New York is still on the previous day',
    instant: '2026-07-28T02:00:00.000Z', timeZone: 'America/New_York', expectedDay: '2026-07-27' },
  { name: 'just after UTC midnight, Tirane is on the new day',
    instant: '2026-07-28T02:00:00.000Z', timeZone: 'Europe/Tirane', expectedDay: '2026-07-28' },

  // DST boundaries — the reason this uses Intl rather than fixed offsets.
  { name: 'European spring-forward night, before the jump',
    instant: '2026-03-29T00:30:00.000Z', timeZone: 'Europe/Tirane', expectedDay: '2026-03-29' },
  { name: 'US autumn fall-back morning',
    instant: '2026-11-01T05:30:00.000Z', timeZone: 'America/New_York', expectedDay: '2026-11-01' },

  // A half-hour zone, which offset arithmetic in whole hours would get wrong.
  { name: 'half-hour offset zone (UTC+5:45)',
    instant: '2026-07-27T18:30:00.000Z', timeZone: 'Asia/Kathmandu', expectedDay: '2026-07-28' },

  // Exactly midnight in the zone belongs to the new day, not the old one.
  { name: 'exact local midnight belongs to the starting day',
    instant: '2026-07-27T22:00:00.000Z', timeZone: 'Europe/Tirane', expectedDay: '2026-07-28' },
];

describe('tenantDay (frontend)', () => {
  describe('dayKeyInZone — shared fixture', () => {
    it.each(TIMEZONE_DAY_FIXTURES)('$name', ({ instant, timeZone, expectedDay }) => {
      expect(dayKeyInZone(instant, timeZone)).toBe(expectedDay);
    });
  });

  it('accepts an ISO string or a Date, since the API returns strings', () => {
    const iso = '2026-07-27T21:30:00.000Z';
    expect(dayKeyInZone(iso, 'Europe/Tirane')).toBe(dayKeyInZone(new Date(iso), 'Europe/Tirane'));
  });

  describe('isSameDayInZone', () => {
    it('groups two instants that share a tenant-local day', () => {
      expect(
        isSameDayInZone('2026-07-27T06:00:00.000Z', '2026-07-27T19:00:00.000Z', 'Europe/Tirane')
      ).toBe(true);
    });

    it('separates instants that straddle tenant-local midnight', () => {
      // 21:30Z is 23:30 in Tirane; 22:30Z is 00:30 the next day.
      expect(
        isSameDayInZone('2026-07-27T21:30:00.000Z', '2026-07-27T22:30:00.000Z', 'Europe/Tirane')
      ).toBe(false);
    });

    it('does not follow the browser timezone', () => {
      // The regression guard. `isSameDayLocal` used browser-local date parts,
      // so this pair's grouping changed with the viewer's machine. Resolving
      // through an explicit zone makes the answer a property of the data.
      const a = '2026-07-27T21:30:00.000Z';
      const b = '2026-07-27T22:30:00.000Z';

      expect(isSameDayInZone(a, b, 'Europe/Tirane')).toBe(false);
      expect(isSameDayInZone(a, b, 'Africa/Addis_Ababa')).toBe(true);
      // Different answers, but each is a deliberate function of the tenant's
      // zone rather than of whoever happens to be looking.
    });
  });
});
