import { PrismaClient } from '@prisma/client';
import { prisma as defaultPrisma } from '../../shared/infrastructure/prisma/client';
import { NotificationSettings } from '../domain/NotificationSettings';
import { INotificationSettingsRepository } from '../domain/INotificationSettingsRepository';

export class PrismaNotificationSettingsRepository implements INotificationSettingsRepository {
  constructor(private readonly prisma: PrismaClient = defaultPrisma) {}

  async get(tenantId: string): Promise<NotificationSettings> {
    // The two array columns are native `String[]` on Postgres, so the row maps
    // straight through. The MySQL build had to cast them out of `Json` here.
    const row = await this.prisma.notificationSettings.findUnique({ where: { tenantId } });
    return row ? NotificationSettings.fromPersistence(row) : NotificationSettings.defaults(tenantId);
  }

  async save(settings: NotificationSettings): Promise<void> {
    const data = {
      emailEnabled: settings.emailEnabled,
      emailEventTypes: settings.emailEventTypes,
      emailRecipientRoles: settings.emailRecipientRoles,
      appointmentRemindersEnabled: settings.appointmentRemindersEnabled,
      appointmentReminderLeadMinutes: settings.appointmentReminderLeadMinutes,
      quotationFollowUpEnabled: settings.quotationFollowUpEnabled,
      quotationFollowUpDays: settings.quotationFollowUpDays,
      quotationAutoExpireEnabled: settings.quotationAutoExpireEnabled,
      quotationExpiryDays: settings.quotationExpiryDays,
    };

    await this.prisma.notificationSettings.upsert({
      where: { tenantId: settings.tenantId },
      create: { tenantId: settings.tenantId, ...data },
      update: data,
    });
  }

  async listAll(): Promise<NotificationSettings[]> {
    /*
     * Driven from Tenant, not from NotificationSettings. Selecting the settings
     * table would return only workspaces that have opened the settings page at
     * least once — every other tenant would silently never be swept, which is
     * exactly the bug that "defaults live in the domain" is meant to prevent.
     *
     * Suspended workspaces are excluded here rather than inside each job: a
     * suspended tenant cannot log in, so mailing its staff about an appointment
     * they cannot open would be noise at best.
     */
    const tenants = await this.prisma.tenant.findMany({
      where: { subscriptionStatus: 'ACTIVE' },
      select: { id: true, notificationSettings: true },
    });

    return tenants.map((t) =>
      t.notificationSettings
        ? NotificationSettings.fromPersistence(t.notificationSettings)
        : NotificationSettings.defaults(t.id)
    );
  }
}
