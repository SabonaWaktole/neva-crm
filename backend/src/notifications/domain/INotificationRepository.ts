import { Notification } from './Notification';

export interface NotificationPage {
  items: Notification[];
  unreadCount: number;
}

export interface INotificationRepository {
  /**
   * Writes many rows at once. Fan-out (e.g. every Business Owner on a
   * submitted quotation) is the normal case, not the exception, so the bulk
   * form is the primary one.
   */
  saveMany(notifications: Notification[]): Promise<void>;

  /** Newest first, scoped to one recipient within one tenant. */
  findForRecipient(
    tenantId: string,
    recipientUserId: string,
    options?: { limit?: number; unreadOnly?: boolean }
  ): Promise<NotificationPage>;

  /**
   * Marks one notification read. Scoped by tenant AND recipient so a caller
   * cannot mark someone else's row — the id alone is not authority.
   * Returns false when nothing matched.
   */
  markRead(tenantId: string, recipientUserId: string, notificationId: string): Promise<boolean>;

  /** Marks every unread row for one recipient. Returns how many changed. */
  markAllRead(tenantId: string, recipientUserId: string): Promise<number>;

  /**
   * Retention, applied opportunistically when a recipient fetches their list
   * rather than on a timer — this project has no scheduler, and a policy that
   * depends on infrastructure that does not exist is not a policy.
   *
   * Scoped to the fetching recipient's own rows. A tenant nobody visits never
   * prunes, which is harmless precisely because nobody is querying it.
   */
  pruneForRecipient(
    tenantId: string,
    recipientUserId: string,
    cutoffs: { readBefore: Date; unreadBefore: Date }
  ): Promise<number>;
}
