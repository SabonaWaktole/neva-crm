import { PrismaClient } from '@prisma/client';
import { prisma as defaultPrisma } from '../../shared/infrastructure/prisma/client';
import { Notification } from '../domain/Notification';
import { INotificationRepository, NotificationPage } from '../domain/INotificationRepository';
import {
  NotificationType,
  NotificationEntityType,
  NotificationParams,
} from '../domain/NotificationType';

export class PrismaNotificationRepository implements INotificationRepository {
  constructor(private readonly prisma: PrismaClient = defaultPrisma) {}

  async saveMany(notifications: Notification[]): Promise<void> {
    if (notifications.length === 0) return;

    await this.prisma.notification.createMany({
      data: notifications.map((n) => ({
        id: n.id,
        tenantId: n.tenantId,
        recipientUserId: n.recipientUserId,
        type: n.type,
        params: n.params,
        actorUserId: n.actorUserId,
        entityType: n.entityType,
        entityId: n.entityId,
        readAt: n.readAt,
        createdAt: n.createdAt,
      })),
    });
  }

  async findForRecipient(
    tenantId: string,
    recipientUserId: string,
    options: { limit?: number; unreadOnly?: boolean } = {}
  ): Promise<NotificationPage> {
    const where = {
      tenantId,
      recipientUserId,
      ...(options.unreadOnly ? { readAt: null } : {}),
    };

    // The count is of UNREAD rows regardless of the filter — it drives the
    // bell badge, which must not change just because the list is filtered.
    const [rows, unreadCount] = await Promise.all([
      this.prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: options.limit ?? 50,
      }),
      this.prisma.notification.count({ where: { tenantId, recipientUserId, readAt: null } }),
    ]);

    return { items: rows.map((r) => this.toDomain(r)), unreadCount };
  }

  async markRead(
    tenantId: string,
    recipientUserId: string,
    notificationId: string
  ): Promise<boolean> {
    // tenantId AND recipientUserId are in the WHERE, not just the id: knowing
    // a notification's id must not be enough to mark someone else's read.
    const result = await this.prisma.notification.updateMany({
      where: { id: notificationId, tenantId, recipientUserId, readAt: null },
      data: { readAt: new Date() },
    });
    return result.count > 0;
  }

  async markAllRead(tenantId: string, recipientUserId: string): Promise<number> {
    const result = await this.prisma.notification.updateMany({
      where: { tenantId, recipientUserId, readAt: null },
      data: { readAt: new Date() },
    });
    return result.count;
  }

  async pruneForRecipient(
    tenantId: string,
    recipientUserId: string,
    cutoffs: { readBefore: Date; unreadBefore: Date }
  ): Promise<number> {
    // Two windows in one statement: read rows go at the shorter horizon,
    // unread ones survive longer so nothing vanishes before it is seen.
    const result = await this.prisma.notification.deleteMany({
      where: {
        tenantId,
        recipientUserId,
        OR: [
          { readAt: { not: null }, createdAt: { lt: cutoffs.readBefore } },
          { readAt: null, createdAt: { lt: cutoffs.unreadBefore } },
        ],
      },
    });
    return result.count;
  }

  private toDomain(record: {
    id: string;
    tenantId: string;
    recipientUserId: string;
    type: string;
    params: unknown;
    actorUserId: string | null;
    entityType: string | null;
    entityId: string | null;
    readAt: Date | null;
    createdAt: Date;
  }): Notification {
    return Notification.create({
      id: record.id,
      tenantId: record.tenantId,
      recipientUserId: record.recipientUserId,
      type: record.type as NotificationType,
      params: (record.params ?? {}) as NotificationParams,
      // Rebuilt from storage rather than created fresh, so the "actor is not
      // the recipient" guard in Notification.create must not reject a row that
      // is already persisted. It cannot: the guard only fires when both are
      // set and equal, which saveMany never writes.
      actorUserId: record.actorUserId,
      entityType: record.entityType as NotificationEntityType | null,
      entityId: record.entityId,
      readAt: record.readAt,
      createdAt: record.createdAt,
    });
  }
}
