import { ScheduledJob } from '../Scheduler';
import { ISchedulerQueries } from '../ISchedulerQueries';
import { INotificationSettingsRepository } from '../../notifications/domain/INotificationSettingsRepository';
import { NotificationService } from '../../notifications/application/NotificationService';

/**
 * Appointment reminders (§6.6).
 *
 * "Automated reminder sent in advance of an upcoming appointment", with a lead
 * time "configurable per business" — hence the per-tenant loop rather than one
 * query with a shared window.
 *
 * Runs every five minutes. That is the resolution of the feature, not a
 * performance compromise: with a lead time measured in hours or days, a
 * reminder arriving up to five minutes late is indistinguishable from one
 * arriving on time, and a tighter interval would only sweep more often to find
 * nothing.
 */
export class AppointmentReminderJob implements ScheduledJob {
  readonly name = 'appointment-reminders';
  readonly intervalMs = 5 * 60_000;

  constructor(
    private readonly queries: ISchedulerQueries,
    private readonly settingsRepo: INotificationSettingsRepository,
    private readonly notifications: NotificationService
  ) {}

  async run(now: Date): Promise<string> {
    const allSettings = await this.settingsRepo.listAll();
    let sent = 0;

    for (const settings of allSettings) {
      if (!settings.appointmentRemindersEnabled) continue;

      const due = await this.queries.findAppointmentsDueReminder(
        settings.tenantId,
        now,
        settings.appointmentReminderLeadMinutes
      );

      for (const appointment of due) {
        /*
         * Mark first, then notify.
         *
         * The reverse order looks safer — mark only what definitely went out —
         * but it fails worse: a crash between the two would leave the row
         * unmarked and the next sweep would remind the same person again. A
         * missed reminder is a small harm and a visible one; a duplicate
         * reminder loop is a large harm and an invisible one until a customer
         * complains.
         *
         * `emitSafe` then guarantees the notify step cannot throw back into
         * this loop and abandon the rest of the tenant's appointments.
         */
        await this.queries.markAppointmentReminded(appointment.id, now);

        await this.notifications.emitSafe({
          tenantId: appointment.tenantId,
          recipientUserIds: [appointment.assignedUserId],
          type: 'APPOINTMENT_REMINDER',
          params: {
            clientName: appointment.clientName,
            scheduledAt: appointment.scheduledAt.toISOString(),
          },
          // No actor: nobody did this, a clock did. Leaving it null is also
          // what stops NotificationService dropping the assignee as "the
          // person who caused it".
          actorUserId: null,
          entityType: 'APPOINTMENT',
          entityId: appointment.id,
        });
        sent += 1;
      }
    }

    return `${sent} reminder(s) sent`;
  }
}
