 import {
  NotificationType,
  NotificationEntityType,
  NotificationParams,
} from './NotificationType';

export interface NotificationProps {
  id: string;
  tenantId: string;
  recipientUserId: string;
  type: NotificationType;
  params: NotificationParams;
  actorUserId?: string | null;
  entityType?: NotificationEntityType | null;
  entityId?: string | null;
  readAt?: Date | null;
  createdAt?: Date;
}

/**
 * One notification, addressed to one recipient.
 *
 * Fan-out is modelled as N rows rather than one row with N readers: read state
 * is per person, and a per-recipient row makes both the unread count and the
 * mark-as-read write a single-row operation with no join.
 */
export class Notification {
  readonly id: string;
  readonly tenantId: string;
  readonly recipientUserId: string;
  readonly type: NotificationType;
  readonly params: NotificationParams;
  readonly actorUserId: string | null;
  readonly entityType: NotificationEntityType | null;
  readonly entityId: string | null;
  readonly createdAt: Date;
  private _readAt: Date | null;

  private constructor(props: NotificationProps) {
    this.id = props.id;
    this.tenantId = props.tenantId;
    this.recipientUserId = props.recipientUserId;
    this.type = props.type;
    this.params = props.params;
    this.actorUserId = props.actorUserId ?? null;
    this.entityType = props.entityType ?? null;
    this.entityId = props.entityId ?? null;
    this._readAt = props.readAt ?? null;
    this.createdAt = props.createdAt ?? new Date();
  }

  static create(props: NotificationProps): Notification {
    if (!props.tenantId) {
      throw new Error('Notification requires a tenantId');
    }
    if (!props.recipientUserId) {
      throw new Error('Notification requires a recipientUserId');
    }
    // A notification nobody can act on is noise; self-notification is the most
    // likely way to produce it, since every emitting site has an actor.
    if (props.actorUserId && props.actorUserId === props.recipientUserId) {
      throw new Error('A notification cannot be addressed to its own actor');
    }
    return new Notification(props);
  }

  /**
   * Rebuilds a row that is already persisted.
   *
   * Deliberately does NOT apply the self-actor rule. That rule governs what may
   * be *created*; applying it on the way back out means a single row that
   * predates the rule — or that reached the table by some path other than
   * `saveMany`, as the demo seed's direct SQL did — throws while mapping and
   * takes the caller's whole notification list down with it. A read must be
   * able to return what storage holds.
   *
   * The structural requirements are still enforced: a row without a tenant or a
   * recipient cannot be addressed to anyone and is not a notification at all.
   */
  static fromPersistence(props: NotificationProps): Notification {
    if (!props.tenantId) {
      throw new Error('Notification requires a tenantId');
    }
    if (!props.recipientUserId) {
      throw new Error('Notification requires a recipientUserId');
    }
    return new Notification(props);
  }

  get readAt(): Date | null {
    return this._readAt;
  }

  get isRead(): boolean {
    return this._readAt !== null;
  }

  /** Idempotent: marking an already-read notification keeps the first instant. */
  markRead(at: Date = new Date()): void {
    if (this._readAt === null) {
      this._readAt = at;
    }
  }
}
