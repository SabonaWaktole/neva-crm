import { Request, Response } from 'express';
import { GetNotificationsUseCase } from '../../application/GetNotificationsUseCase';
import {
  MarkNotificationReadUseCase,
  MarkAllNotificationsReadUseCase,
} from '../../application/MarkNotificationReadUseCase';
import { requireTenantId } from "@main/interfaces/http/tenantContext";
import { Notification } from '../../domain/Notification';

/**
 * Notifications are addressed to a person, so every handler reads the
 * recipient from the authenticated token — never from a parameter. There is
 * deliberately no "notifications for user X" endpoint: the only user a caller
 * can ask about is themselves, which removes a whole class of authorisation
 * question rather than answering it.
 */
export class NotificationController {
  constructor(
    private readonly getNotifications: GetNotificationsUseCase,
    private readonly markRead: MarkNotificationReadUseCase,
    private readonly markAllRead: MarkAllNotificationsReadUseCase
  ) {}

  list = async (req: Request, res: Response) => {
    try {
      const result = await this.getNotifications.execute({
        tenantId: requireTenantId(req),
        recipientUserId: req.user!.userId,
        limit: this.parseLimit(req.query.limit),
        unreadOnly: req.query.unreadOnly === 'true',
      });

      res.json({
        items: result.items.map(toDTO),
        unreadCount: result.unreadCount,
      });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  };

  markOneRead = async (req: Request, res: Response) => {
    try {
      const result = await this.markRead.execute({
        tenantId: requireTenantId(req),
        recipientUserId: req.user!.userId,
        notificationId: req.params.id as string,
      });

      // 404 rather than 403 when nothing matched. The row either does not
      // exist or belongs to someone else, and the caller must not be able to
      // tell those apart — a 403 would confirm the id is real.
      if (!result.updated) {
        return res.status(404).json({ error: 'Notification not found' });
      }
      res.json({ message: 'Notification marked read' });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  };

  markEverythingRead = async (req: Request, res: Response) => {
    try {
      const result = await this.markAllRead.execute({
        tenantId: requireTenantId(req),
        recipientUserId: req.user!.userId,
      });
      res.json({ updated: result.updated });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  };

  /** Bounded so a caller cannot ask for an unbounded page. */
  private parseLimit(raw: unknown): number {
    const parsed = Number(raw);
    if (!Number.isFinite(parsed) || parsed <= 0) return 30;
    return Math.min(Math.floor(parsed), 100);
  }
}

const toDTO = (n: Notification) => ({
  id: n.id,
  type: n.type,
  params: n.params,
  actorUserId: n.actorUserId,
  entityType: n.entityType,
  entityId: n.entityId,
  readAt: n.readAt?.toISOString() ?? null,
  createdAt: n.createdAt.toISOString(),
});
