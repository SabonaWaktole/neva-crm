import { INotificationRepository, NotificationPage } from '../domain/INotificationRepository';

/**
 * Retention horizons, in days.
 *
 * Read notifications go sooner; unread ones are kept far longer so nothing
 * disappears before anyone has seen it. Both are applied opportunistically —
 * see `pruneForRecipient`.
 */
export const RETENTION_READ_DAYS = 90;
export const RETENTION_UNREAD_DAYS = 180;

const DAY_MS = 24 * 60 * 60 * 1000;

export interface GetNotificationsDTO {
  tenantId: string;
  recipientUserId: string;
  limit?: number;
  unreadOnly?: boolean;
}

export class GetNotificationsUseCase {
  constructor(private readonly notificationRepo: INotificationRepository) {}

  async execute(dto: GetNotificationsDTO): Promise<NotificationPage> {
    /*
     * Retention runs here, on the caller's own rows, because this project has
     * no scheduler and a policy that depends on infrastructure which does not
     * exist is not a policy.
     *
     * Its failure is swallowed: pruning is housekeeping, and a user must still
     * see their notifications if a delete fails. It also runs BEFORE the read
     * so the list never shows a row that the policy has already expired.
     */
    const now = Date.now();
    try {
      await this.notificationRepo.pruneForRecipient(dto.tenantId, dto.recipientUserId, {
        readBefore: new Date(now - RETENTION_READ_DAYS * DAY_MS),
        unreadBefore: new Date(now - RETENTION_UNREAD_DAYS * DAY_MS),
      });
    } catch (error) {
      console.error('Notification pruning failed; continuing to serve the list', error);
    }

    return this.notificationRepo.findForRecipient(dto.tenantId, dto.recipientUserId, {
      limit: dto.limit,
      unreadOnly: dto.unreadOnly,
    });
  }
}
