import { dayKeyInZone, isSameDayInZone, dayBoundsInZone } from '@shared/domain/time/tenantDay';

/**
 * ===========================================================================
 * SHARED FIXTURE — MUST MATCH `frontend/src/utils/tenantDay.test.ts` EXACTLY.
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

describe('tenantDay (backend)', () => {
  describe('dayKeyInZone — shared fixture', () => {
    it.each(TIMEZONE_DAY_FIXTURES)('$name', ({ instant, timeZone, expectedDay }) => {
      expect(dayKeyInZone(new Date(instant), timeZone)).toBe(expectedDay);
    });
  });

  describe('the production bug this closes', () => {
    const instant = new Date('2026-07-27T21:30:00.000Z');

    it('put one instant on two different days depending on host timezone', () => {
      // Documents the defect: these are genuinely different days, which is why
      // a server-local and a browser-local bucket could not agree.
      expect(dayKeyInZone(instant, 'Africa/Addis_Ababa')).toBe('2026-07-28');
      expect(dayKeyInZone(instant, 'Europe/Tirane')).toBe('2026-07-27');
    });

    it('agrees once both sides resolve through the same tenant zone', () => {
      const tenantZone = 'Europe/Tirane';
      expect(dayKeyInZone(instant, tenantZone)).toBe(dayKeyInZone(instant, tenantZone));
      expect(isSameDayInZone(instant, new Date('2026-07-27T08:00:00.000Z'), tenantZone)).toBe(true);
    });
  });

  describe('dayBoundsInZone', () => {
    const now = new Date('2026-07-27T12:00:00.000Z');

    it('brackets the tenant-local day, not the server-local one', () => {
      // Tirane is UTC+2 in July, so its day runs 22:00Z–22:00Z.
      const { start, end } = dayBoundsInZone('Europe/Tirane', 0, now);

      expect(start.toISOString()).toBe('2026-07-26T22:00:00.000Z');
      expect(end.toISOString()).toBe('2026-07-27T22:00:00.000Z');
    });

    it('is consistent with dayKeyInZone at both edges', () => {
      // The invariant the whole feature rests on: an instant is inside the
      // bounds exactly when its day key matches.
      const zone = 'Europe/Tirane';
      const { start, end } = dayBoundsInZone(zone, 0, now);
      const today = dayKeyInZone(now, zone);

      expect(dayKeyInZone(start, zone)).toBe(today);
      expect(dayKeyInZone(new Date(end.getTime() - 1), zone)).toBe(today);
      // `end` itself is the next day — the range is half-open.
      expect(dayKeyInZone(end, zone)).not.toBe(today);
    });

    it('handles negative offsets for the yesterday comparison', () => {
      const { start, end } = dayBoundsInZone('Europe/Tirane', -1, now);

      expect(start.toISOString()).toBe('2026-07-25T22:00:00.000Z');
      expect(end.toISOString()).toBe('2026-07-26T22:00:00.000Z');
    });

    it('produces a 23-hour day across a spring-forward boundary', () => {
      // Europe/Tirane springs forward at 02:00 local on 2026-03-29.
      const duringDst = new Date('2026-03-29T12:00:00.000Z');
      const { start, end } = dayBoundsInZone('Europe/Tirane', 0, duringDst);

      const hours = (end.getTime() - start.getTime()) / 3_600_000;
      expect(hours).toBe(23);
    });

    it('is unaffected by the host timezone', () => {
      // The whole point: the same tenant zone gives the same bounds no matter
      // where the process runs.
      const bounds = dayBoundsInZone('UTC', 0, now);
      expect(bounds.start.toISOString()).toBe('2026-07-27T00:00:00.000Z');
      expect(bounds.end.toISOString()).toBe('2026-07-28T00:00:00.000Z');
    });
  });
});
