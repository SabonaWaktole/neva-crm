/**
 * Checks if a given UTC timestamp falls on the exact same local date as a target local Date object.
 * This is timezone-sensitive and correctly handles boundary crossings (e.g. an appointment
 * scheduled for 2:00 AM UTC might actually be 10:00 PM the previous day locally).
 *
 * @param utcString - The ISO string from the database/API (e.g., '2023-10-15T02:00:00Z')
 * @param localDate - The target local date to check against (e.g., new Date())
 * @returns boolean indicating if the UTC timestamp falls on the local target day
 */
export function isSameDayLocal(utcString: string, localDate: Date): boolean {
  const utcDate = new Date(utcString);
  
  return (
    utcDate.getFullYear() === localDate.getFullYear() &&
    utcDate.getMonth() === localDate.getMonth() &&
    utcDate.getDate() === localDate.getDate()
  );
}
