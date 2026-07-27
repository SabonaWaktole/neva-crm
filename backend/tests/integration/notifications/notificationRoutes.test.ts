import request from 'supertest';
import { createApp } from '../../../src/main/app';
import { PrismaClient } from '@prisma/client';
import { JwtTokenService } from '../../../src/auth/infrastructure/JwtTokenService';
import { v4 as uuidv4 } from 'uuid';
import {
  RETENTION_READ_DAYS,
  RETENTION_UNREAD_DAYS,
} from '../../../src/notifications/application/GetNotificationsUseCase';

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Notifications end to end, against a real database.
 *
 * Teardown is scoped to the tenants this file creates — never a bare
 * `deleteMany()` per table. See TD-001: workers share a schema across files, so
 * an unscoped wipe deletes a neighbouring suite's fixtures and the failure
 * surfaces somewhere innocent.
 */
describe('Notifications', () => {
  let app: any;
  let prisma: PrismaClient;
  let tokenService: JwtTokenService;

  const slug = 'notify-tenant';
  const otherSlug = 'notify-other-tenant';

  let tenantId: string;
  let otherTenantId: string;
  let ownerId: string;
  let staffId: string;
  let otherTenantUserId: string;
  let ownerToken: string;
  let staffToken: string;
  let otherToken: string;

  const createdTenantIds: string[] = [];

  const clearCreated = async () => {
    if (createdTenantIds.length === 0) return;
    const where = { tenantId: { in: createdTenantIds } };
    await prisma.notification.deleteMany({ where });
    await prisma.quotationStatusHistory.deleteMany({ where });
    await prisma.quotationLineItem.deleteMany({ where });
    await prisma.quotation.deleteMany({ where });
    await prisma.interaction.deleteMany({ where });
    await prisma.appointment.deleteMany({ where });
    await prisma.client.deleteMany({ where });
    await prisma.invitation.deleteMany({ where });
    await prisma.user.deleteMany({ where });
    await prisma.integration.deleteMany({ where });
    await prisma.tenant.deleteMany({ where: { id: { in: createdTenantIds } } });
    createdTenantIds.length = 0;
  };

  const seedNotification = (over: Partial<{
    recipientUserId: string;
    tenantId: string;
    readAt: Date | null;
    createdAt: Date;
    type: string;
  }> = {}) =>
    prisma.notification.create({
      data: {
        id: uuidv4(),
        tenantId: over.tenantId ?? tenantId,
        recipientUserId: over.recipientUserId ?? staffId,
        type: over.type ?? 'CLIENT_ASSIGNED',
        params: { client: 'Acme' },
        actorUserId: ownerId,
        entityType: 'CLIENT',
        entityId: 'client-1',
        readAt: over.readAt ?? null,
        createdAt: over.createdAt ?? new Date(),
      },
    });

  beforeAll(async () => {
    prisma = new PrismaClient();
    await prisma.$connect();
    app = createApp();
    tokenService = new JwtTokenService();
  });

  beforeEach(async () => {
    await clearCreated();

    tenantId = uuidv4();
    otherTenantId = uuidv4();
    createdTenantIds.push(tenantId, otherTenantId);

    await prisma.tenant.createMany({
      data: [
        { id: tenantId, name: 'Notify Tenant', urlSlug: slug },
        { id: otherTenantId, name: 'Other Tenant', urlSlug: otherSlug },
      ],
    });

    ownerId = uuidv4();
    staffId = uuidv4();
    otherTenantUserId = uuidv4();
    await prisma.user.createMany({
      data: [
        { id: ownerId, email: 'owner@notify.test', hashedPassword: 'h', role: 'BUSINESS_OWNER', tenantId },
        { id: staffId, email: 'staff@notify.test', hashedPassword: 'h', role: 'STAFF', tenantId },
        { id: otherTenantUserId, email: 'other@notify.test', hashedPassword: 'h', role: 'BUSINESS_OWNER', tenantId: otherTenantId },
      ],
    });

    ownerToken = tokenService.sign({ userId: ownerId, role: 'BUSINESS_OWNER' as any, tenantId, tenantSlug: slug, warehouseId: null });
    staffToken = tokenService.sign({ userId: staffId, role: 'STAFF' as any, tenantId, tenantSlug: slug, warehouseId: null });
    otherToken = tokenService.sign({ userId: otherTenantUserId, role: 'BUSINESS_OWNER' as any, tenantId: otherTenantId, tenantSlug: otherSlug, warehouseId: null });
  });

  afterAll(async () => {
    await clearCreated();
    await prisma.$disconnect();
  });

  const list = (token: string, query = '') =>
    request(app).get(`/api/${slug}/notifications${query}`).set('Authorization', `Bearer ${token}`);

  describe('listing', () => {
    it('returns only the caller\'s own notifications', async () => {
      await seedNotification({ recipientUserId: staffId });
      await seedNotification({ recipientUserId: ownerId });

      const res = await list(staffToken);

      expect(res.status).toBe(200);
      expect(res.body.items).toHaveLength(1);
    });

    it('never leaks another tenant\'s notifications, even for the same user id', async () => {
      // The row is addressed to this user id but stamped with another tenant.
      // Scoping by recipient alone would return it.
      await prisma.notification.create({
        data: {
          id: uuidv4(), tenantId: otherTenantId, recipientUserId: otherTenantUserId,
          type: 'CLIENT_ASSIGNED', params: {}, createdAt: new Date(),
        },
      });
      await seedNotification({ recipientUserId: staffId });

      const res = await list(staffToken);

      expect(res.body.items).toHaveLength(1);
      const otherRes = await request(app)
        .get(`/api/${otherSlug}/notifications`)
        .set('Authorization', `Bearer ${otherToken}`);
      expect(otherRes.body.items).toHaveLength(1);
    });

    it('returns newest first', async () => {
      const old = await seedNotification({ createdAt: new Date(Date.now() - 5 * DAY_MS), type: 'QUOTATION_APPROVED' });
      const recent = await seedNotification({ createdAt: new Date(), type: 'QUOTATION_REJECTED' });

      const res = await list(staffToken);

      expect(res.body.items.map((n: any) => n.id)).toEqual([recent.id, old.id]);
    });

    it('reports an unread count that ignores the unreadOnly filter', async () => {
      await seedNotification({ readAt: null });
      await seedNotification({ readAt: new Date() });

      const all = await list(staffToken);
      const unread = await list(staffToken, '?unreadOnly=true');

      expect(all.body.items).toHaveLength(2);
      expect(unread.body.items).toHaveLength(1);
      // The badge must not change because the list was filtered.
      expect(all.body.unreadCount).toBe(1);
      expect(unread.body.unreadCount).toBe(1);
    });

    it('serves a key and params rather than a rendered message (TD-016)', async () => {
      await seedNotification();

      const res = await list(staffToken);

      expect(res.body.items[0].type).toBe('CLIENT_ASSIGNED');
      expect(res.body.items[0].params).toEqual({ client: 'Acme' });
      expect(res.body.items[0].message).toBeUndefined();
    });

    it('requires authentication', async () => {
      const res = await request(app).get(`/api/${slug}/notifications`);
      expect([401, 403]).toContain(res.status);
    });

    it('is available to STAFF as well as owners — every role has notifications', async () => {
      await seedNotification({ recipientUserId: staffId });
      expect((await list(staffToken)).status).toBe(200);
      expect((await list(ownerToken)).status).toBe(200);
    });
  });

  describe('marking read', () => {
    it('marks one notification read', async () => {
      const n = await seedNotification();

      const res = await request(app)
        .patch(`/api/${slug}/notifications/${n.id}/read`)
        .set('Authorization', `Bearer ${staffToken}`);

      expect(res.status).toBe(200);
      const after = await prisma.notification.findUnique({ where: { id: n.id } });
      expect(after!.readAt).not.toBeNull();
    });

    it('refuses to mark someone else\'s notification, and does not change it', async () => {
      const n = await seedNotification({ recipientUserId: ownerId });

      const res = await request(app)
        .patch(`/api/${slug}/notifications/${n.id}/read`)
        .set('Authorization', `Bearer ${staffToken}`);

      // 404, not 403: a 403 would confirm the id exists.
      expect(res.status).toBe(404);
      const after = await prisma.notification.findUnique({ where: { id: n.id } });
      expect(after!.readAt).toBeNull();
    });

    it('refuses across a tenant boundary', async () => {
      const n = await seedNotification({ recipientUserId: staffId });

      const res = await request(app)
        .patch(`/api/${otherSlug}/notifications/${n.id}/read`)
        .set('Authorization', `Bearer ${otherToken}`);

      expect(res.status).toBe(404);
      const after = await prisma.notification.findUnique({ where: { id: n.id } });
      expect(after!.readAt).toBeNull();
    });

    it('marks everything read for the caller only', async () => {
      await seedNotification({ recipientUserId: staffId });
      await seedNotification({ recipientUserId: staffId });
      const othersRow = await seedNotification({ recipientUserId: ownerId });

      const res = await request(app)
        .patch(`/api/${slug}/notifications/read-all`)
        .set('Authorization', `Bearer ${staffToken}`);

      expect(res.status).toBe(200);
      expect(res.body.updated).toBe(2);
      const untouched = await prisma.notification.findUnique({ where: { id: othersRow.id } });
      expect(untouched!.readAt).toBeNull();
    });
  });

  describe('retention (opportunistic, on fetch)', () => {
    it('prunes read notifications past the read horizon', async () => {
      const stale = await seedNotification({
        readAt: new Date(),
        createdAt: new Date(Date.now() - (RETENTION_READ_DAYS + 1) * DAY_MS),
      });

      await list(staffToken);

      expect(await prisma.notification.findUnique({ where: { id: stale.id } })).toBeNull();
    });

    it('KEEPS an unread notification of the same age — that is the point of two horizons', async () => {
      const oldUnread = await seedNotification({
        readAt: null,
        createdAt: new Date(Date.now() - (RETENTION_READ_DAYS + 1) * DAY_MS),
      });

      await list(staffToken);

      expect(await prisma.notification.findUnique({ where: { id: oldUnread.id } })).not.toBeNull();
    });

    it('prunes unread notifications past the longer unread horizon', async () => {
      const ancient = await seedNotification({
        readAt: null,
        createdAt: new Date(Date.now() - (RETENTION_UNREAD_DAYS + 1) * DAY_MS),
      });

      await list(staffToken);

      expect(await prisma.notification.findUnique({ where: { id: ancient.id } })).toBeNull();
    });

    it('never prunes another user\'s rows', async () => {
      const othersStale = await seedNotification({
        recipientUserId: ownerId,
        readAt: new Date(),
        createdAt: new Date(Date.now() - (RETENTION_READ_DAYS + 1) * DAY_MS),
      });

      // Staff fetching must not clean up on the owner's behalf.
      await list(staffToken);

      expect(await prisma.notification.findUnique({ where: { id: othersStale.id } })).not.toBeNull();
    });

    it('leaves recent notifications alone', async () => {
      const fresh = await seedNotification({ createdAt: new Date() });

      await list(staffToken);

      expect(await prisma.notification.findUnique({ where: { id: fresh.id } })).not.toBeNull();
    });
  });
});
