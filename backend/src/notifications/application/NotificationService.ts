import { randomUUID } from 'crypto';
import { Notification } from '../domain/Notification';
import { INotificationRepository } from '../domain/INotificationRepository';
import {
  NotificationType,
  NotificationEntityType,
  NotificationParams,
} from '../domain/NotificationType';
import { IUserRepository } from '../../auth/domain/repositories/IUserRepository';
import { UserRole } from '../../auth/domain/enums/UserRole';

export interface EmitInput {
  tenantId: string;
  /** Explicit recipients. Combined with `toRole` if both are given. */
  recipientUserIds?: string[];
  /** Fan-out to every ACTIVE holder of a role in the tenant. */
  toRole?: UserRole;
  type: NotificationType;
  params: NotificationParams;
  actorUserId?: string | null;
  entityType?: NotificationEntityType | null;
  entityId?: string | null;
}

/**
 * The single place notifications are created.
 *
 * Every emitting site calls `emit`. Centralising it keeps three rules in one
 * place instead of eleven:
 *
 *  1. **Never notify the actor about their own action.** Approving your own
 *     quotation should not put a badge on your own bell.
 *  2. **Never notify a deactivated user.** Their token survives deactivation by
 *     up to an hour (TD-010), so recipients are filtered on the RECORD.
 *  3. **Emitting must never break the thing that triggered it.** See `emitSafe`.
 */
export class NotificationService {
  constructor(
    private readonly notificationRepo: INotificationRepository,
    private readonly userRepo: IUserRepository
  ) {}

  async emit(input: EmitInput): Promise<Notification[]> {
    const recipientIds = await this.resolveRecipients(input);
    if (recipientIds.length === 0) return [];

    const notifications = recipientIds.map((recipientUserId) =>
      Notification.create({
        id: randomUUID(),
        tenantId: input.tenantId,
        recipientUserId,
        type: input.type,
        params: input.params,
        actorUserId: input.actorUserId ?? null,
        entityType: input.entityType ?? null,
        entityId: input.entityId ?? null,
      })
    );

    await this.notificationRepo.saveMany(notifications);
    return notifications;
  }

  /**
   * `emit` that swallows its own failures.
   *
   * Used at every emitting site that is NOT inside a transaction. A quotation
   * approval must not fail because the notification insert did — the business
   * action is the point, the notification is a side effect. Inside a unit of
   * work the opposite holds and `emit` is used directly, so the notification
   * commits or rolls back with the change it describes.
   */
  async emitSafe(input: EmitInput): Promise<void> {
    try {
      await this.emit(input);
    } catch (error) {
      console.error('Failed to emit notification', { type: input.type, error });
    }
  }

  private async resolveRecipients(input: EmitInput): Promise<string[]> {
    const ids = new Set(input.recipientUserIds ?? []);

    if (input.toRole) {
      const holders = await this.userRepo.findActiveByTenantAndRole(input.tenantId, input.toRole);
      for (const user of holders) ids.add(user.id);
    }

    // Rule 1: never tell someone what they just did.
    if (input.actorUserId) ids.delete(input.actorUserId);

    const candidates = [...ids];
    if (candidates.length === 0) return [];

    // Rule 2. `toRole` already filtered on isActive, but explicit
    // recipientUserIds have not been checked at all — an appointment can be
    // assigned to a member who was deactivated moments earlier.
    const verified = await Promise.all(
      candidates.map(async (id) => {
        const user = await this.userRepo.findById(id);
        if (!user || !user.isActive) return null;
        // Tenant isolation on the record, not just the caller's token.
        if (user.tenantId !== input.tenantId) return null;
        return id;
      })
    );

    return verified.filter((id): id is string => id !== null);
  }
}
