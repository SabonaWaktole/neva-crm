/**
 * SUPERSEDED — do not use `isSameDayLocal` in new code.
 *
 * It compares BROWSER-LOCAL date components, which made "which day is this?"
 * a property of the viewer's machine rather than of the data. That disagreed
 * with the server, whose dashboard KPI bucketed by the SERVER host's timezone:
 * with the host on UTC+3 and a user on UTC+2, a 21:30Z appointment was counted
 * "today" by the dashboard and drawn on the next day by the calendar.
 *
 * Use `isSameDayInZone` / `dayKeyInZone` from `utils/tenantDay.ts`, which
 * resolve through the tenant's configured timezone, or the `isSameDay` /
 * `dayKey` helpers on `useDateFormat()`.
 *
 * Kept only because its boundary tests still document the semantics; it has no
 * remaining callers in application code.
 */
export function isSameDayLocal(utcString: string, localDate: Date): boolean {
  const utcDate = new Date(utcString);
  
  return (
    utcDate.getFullYear() === localDate.getFullYear() &&
    utcDate.getMonth() === localDate.getMonth() &&
    utcDate.getDate() === localDate.getDate()
  );
}
