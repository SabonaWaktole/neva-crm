import type { Appointment } from '../types/appointment';

/**
 * Patches an appointment in a local list.
 * Useful for optimistic updates or localized event callbacks where the parent 
 * maintains the array state and needs to replace a single item without a full refetch.
 */
export function patchAppointmentInList(
  list: Appointment[],
  updatedAppointment: Appointment
): Appointment[] {
  return list.map(app => 
    app.id === updatedAppointment.id ? updatedAppointment : app
  );
}
