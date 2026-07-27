import { INotificationRepository } from '../domain/INotificationRepository';

export interface MarkNotificationReadDTO {
  tenantId: string;
  recipientUserId: string;
  notificationId: string;
}

/**
 * Marking read needs no role check: a notification belongs to exactly one
 * person, and the repository scopes every write by tenant AND recipient. The
 * authorisation IS the scoping — there is no id a caller can supply that
 * reaches another user's row.
 */
export class MarkNotificationReadUseCase {
  constructor(private readonly notificationRepo: INotificationRepository) {}

  async execute(dto: MarkNotificationReadDTO): Promise<{ updated: boolean }> {
    const updated = await this.notificationRepo.markRead(
      dto.tenantId,
      dto.recipientUserId,
      dto.notificationId
    );
    return { updated };
  }
}

export interface MarkAllNotificationsReadDTO {
  tenantId: string;
  recipientUserId: string;
}

export class MarkAllNotificationsReadUseCase {
  constructor(private readonly notificationRepo: INotificationRepository) {}

  async execute(dto: MarkAllNotificationsReadDTO): Promise<{ updated: number }> {
    const updated = await this.notificationRepo.markAllRead(dto.tenantId, dto.recipientUserId);
    return { updated };
  }
}
