/**
 * "What day is it?" resolved in a tenant's configured timezone.
 *
 * ---------------------------------------------------------------------------
 * THIS FILE IS DUPLICATED IN THE BACKEND:
 * `backend/src/shared/domain/time/tenantDay.ts`.
 *
 * Backend and frontend are separate packages with no shared module path, so the
 * definition of a calendar day cannot physically live in one place. It is
 * duplicated, and kept honest by an identical fixture table asserted in BOTH
 * test suites:
 *
 *   frontend/src/utils/tenantDay.test.ts
 *   backend/tests/unit/shared/tenantDay.test.ts
 *
 * If you change the logic here, change it there, and both suites will tell you
 * if you did not.
 * ---------------------------------------------------------------------------
 *
 * This replaces `isSameDayLocal`, which compared browser-local date components.
 * That was self-consistent but disagreed with the server: the dashboard's
 * "Appointments Today" KPI bucketed by the SERVER host's timezone, so with the
 * server on UTC+3 and a user on UTC+2, a 21:30Z appointment was counted as
 * "today" on the dashboard and drawn on the next day in the calendar.
 */

/**
 * The tenant-local calendar day of an instant, as `YYYY-MM-DD`.
 *
 * `en-CA` is used because it yields ISO-ordered `YYYY-MM-DD`, which compares as
 * a plain string. It is a formatting detail, unrelated to the tenant's display
 * locale — the day a thing happens on must not change because someone switched
 * their number formatting.
 */
export function dayKeyInZone(instant: Date | string, timeZone: string): string {
  const date = typeof instant === 'string' ? new Date(instant) : instant;
  return new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

/** True when both instants fall on the same calendar day in `timeZone`. */
export function isSameDayInZone(
  a: Date | string,
  b: Date | string,
  timeZone: string
): boolean {
  return dayKeyInZone(a, timeZone) === dayKeyInZone(b, timeZone);
}
