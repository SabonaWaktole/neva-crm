import { NotificationSettings } from './NotificationSettings';

export interface INotificationSettingsRepository {
  /**
   * Never returns null: a tenant with no stored row gets
   * `NotificationSettings.defaults()`. Callers therefore never branch on
   * "unconfigured", which is what keeps the default in one place.
   */
  get(tenantId: string): Promise<NotificationSettings>;

  /** Upsert — the row may not exist yet, and the caller should not have to care. */
  save(settings: NotificationSettings): Promise<void>;

  /**
   * Every tenant with scheduling enabled, for the sweeps.
   *
   * The scheduler is cross-tenant by nature, so it reads settings in bulk
   * rather than one query per tenant per tick. Tenants with no stored row are
   * included, carrying their defaults — otherwise a workspace that never opened
   * the settings page would silently never get reminders.
   */
  listAll(): Promise<NotificationSettings[]>;
}
