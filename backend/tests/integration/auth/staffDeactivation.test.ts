import request from 'supertest';
import { createApp } from '../../../src/main/app';
import { PrismaClient } from '@prisma/client';
import { JwtTokenService } from '../../../src/auth/infrastructure/JwtTokenService';
import { ClientStatus } from '../../../src/clients/domain/enums/ClientStatus';
import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';

/**
 * Staff off-boarding.
 *
 * Deactivation, never deletion: seven non-nullable columns reference User, so a
 * delete is blocked by RESTRICT and cascading would destroy financial and audit
 * history — the same reasoning behind ProductInUseError.
 *
 * The guarantee this provides is precise and worth stating: a deactivated user
 * cannot obtain a NEW token, and their browser session drops on the next
 * /auth/me call. It is NOT instant revocation — `authenticate` only verifies the
 * JWT signature and never reads the database, so an already-issued token keeps
 * working against other endpoints until it expires. See TD-010.
 */
describe('Staff deactivation', () => {
  let app: any;
  let prisma: PrismaClient;
  let tokenService: JwtTokenService;

  const runId = uuidv4().slice(0, 8);
  const slug = `deact-${runId}`;
  const otherSlug = `deact-other-${runId}`;
  const PASSWORD = 'Password1';

  let tenantId: string;
  let otherTenantId: string;
  let ownerId: string;
  let staffId: string;
  let otherTenantStaffId: string;
  let ownerToken: string;
  let staffToken: string;
  let otherOwnerToken: string;

  const staffEmail = () => `staff-${runId}@t.com`;

  beforeAll(async () => {
    prisma = new PrismaClient();
    await prisma.$connect();
    app = createApp();
    tokenService = new JwtTokenService();
  }, 60000);

  afterAll(async () => {
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    tenantId = uuidv4();
    otherTenantId = uuidv4();
    ownerId = uuidv4();
    staffId = uuidv4();
    otherTenantStaffId = uuidv4();

    await prisma.tenant.createMany({
      data: [
        { id: tenantId, name: 'Deact T1', urlSlug: slug },
        { id: otherTenantId, name: 'Deact T2', urlSlug: otherSlug },
      ],
    });

    const hashed = await bcrypt.hash(PASSWORD, 10);
    const otherOwnerId = uuidv4();

    await prisma.user.createMany({
      data: [
        { id: ownerId, email: `owner-${runId}@t.com`, hashedPassword: hashed, role: 'BUSINESS_OWNER', tenantId },
        { id: staffId, email: staffEmail(), hashedPassword: hashed, role: 'STAFF', tenantId },
        { id: otherOwnerId, email: `owner2-${runId}@t.com`, hashedPassword: hashed, role: 'BUSINESS_OWNER', tenantId: otherTenantId },
        { id: otherTenantStaffId, email: `staff2-${runId}@t.com`, hashedPassword: hashed, role: 'STAFF', tenantId: otherTenantId },
      ],
    });

    ownerToken = tokenService.sign({ userId: ownerId, role: 'BUSINESS_OWNER', tenantId, tenantSlug: slug, warehouseId: null });
    staffToken = tokenService.sign({ userId: staffId, role: 'STAFF', tenantId, tenantSlug: slug, warehouseId: null });
    otherOwnerToken = tokenService.sign({ userId: otherOwnerId, role: 'BUSINESS_OWNER', tenantId: otherTenantId, tenantSlug: otherSlug, warehouseId: null });
  });

  afterEach(async () => {
    const ids = [tenantId, otherTenantId];
    await prisma.appointment.deleteMany({ where: { tenantId: { in: ids } } });
    await prisma.client.deleteMany({ where: { tenantId: { in: ids } } });
    await prisma.notification.deleteMany({ where: { tenantId: { in: ids } } });
    await prisma.user.deleteMany({ where: { tenantId: { in: ids } } });
    await prisma.tenant.deleteMany({ where: { id: { in: ids } } });
  });

  const deactivate = (id: string, token: string) =>
    request(app).post(`/api/${slug}/auth/staff/${id}/deactivate`).set('Cookie', [`jwt=${token}`]);

  describe('the core guarantee: no new sessions', () => {
    it('a deactivated user can no longer log in', async () => {
      // Sanity check: they can log in beforehand.
      const before = await request(app)
        .post(`/api/${slug}/auth/login`)
        .send({ email: staffEmail(), password: PASSWORD });
      expect(before.status).toBe(200);

      await deactivate(staffId, ownerToken).expect(200);

      const after = await request(app)
        .post(`/api/${slug}/auth/login`)
        .send({ email: staffEmail(), password: PASSWORD });

      expect(after.status).toBe(401);
    });

    it('gives the same generic error as a wrong password, leaking no account state', async () => {
      await deactivate(staffId, ownerToken).expect(200);

      const deactivated = await request(app)
        .post(`/api/${slug}/auth/login`)
        .send({ email: staffEmail(), password: PASSWORD });
      const wrongPassword = await request(app)
        .post(`/api/${slug}/auth/login`)
        .send({ email: staffEmail(), password: 'WrongPassword9' });

      expect(deactivated.body).toEqual(wrongPassword.body);
    });
  });

  describe('/auth/me rejection', () => {
    it('rejects an existing session on the next /auth/me call', async () => {
      const before = await request(app).get('/api/auth/me').set('Cookie', [`jwt=${staffToken}`]);
      expect(before.status).toBe(200);
      expect(before.body.user).not.toBeNull();

      await deactivate(staffId, ownerToken).expect(200);

      const after = await request(app).get('/api/auth/me').set('Cookie', [`jwt=${staffToken}`]);

      expect(after.status).toBe(401);
      expect(after.body.error).toMatch(/deactivated/i);
    });

    it('clears the auth cookie so the browser does not keep replaying it', async () => {
      await deactivate(staffId, ownerToken).expect(200);

      const res = await request(app).get('/api/auth/me').set('Cookie', [`jwt=${staffToken}`]);

      const setCookie = res.headers['set-cookie'];
      const asText = Array.isArray(setCookie) ? setCookie.join(';') : String(setCookie ?? '');
      expect(asText).toMatch(/jwt=;/);
    });

    it('leaves an active user unaffected', async () => {
      const res = await request(app).get('/api/auth/me').set('Cookie', [`jwt=${staffToken}`]);
      expect(res.status).toBe(200);
    });
  });

  describe('role gating', () => {
    it('returns 403 when a STAFF member attempts a deactivation', async () => {
      await deactivate(staffId, staffToken).expect(403);

      const user = await prisma.user.findUnique({ where: { id: staffId } });
      expect(user?.isActive).toBe(true);
    });

    it('returns 401 when unauthenticated', async () => {
      await request(app).post(`/api/${slug}/auth/staff/${staffId}/deactivate`).expect(401);
    });
  });

  describe('tenant isolation', () => {
    it("refuses to deactivate another tenant's user", async () => {
      // Owner of tenant 2 targeting tenant 1's URL is stopped by resolveTenant.
      await deactivate(staffId, otherOwnerToken).expect(403);

      const user = await prisma.user.findUnique({ where: { id: staffId } });
      expect(user?.isActive).toBe(true);
    });

    it("refuses when the target id belongs to another tenant, even on the owner's own URL", async () => {
      // The decisive case: valid owner, valid tenant in the URL, but the target
      // user lives elsewhere. Only the use case's own check stops this.
      const res = await deactivate(otherTenantStaffId, ownerToken);

      expect(res.status).toBe(400);
      const user = await prisma.user.findUnique({ where: { id: otherTenantStaffId } });
      expect(user?.isActive).toBe(true);
    });
  });

  describe('guards', () => {
    it('refuses to let an owner deactivate themselves', async () => {
      const res = await deactivate(ownerId, ownerToken);
      expect(res.status).toBe(400);

      const owner = await prisma.user.findUnique({ where: { id: ownerId } });
      expect(owner?.isActive).toBe(true);
    });
  });

  describe('deactivation impact', () => {
    it('reports assigned clients and upcoming appointments', async () => {
      const clientId = uuidv4();
      await prisma.client.create({
        data: {
          id: clientId, tenantId, name: 'Held Client', status: ClientStatus.ACTIVE,
          assignedUserId: staffId, lastUpdatedByUserId: staffId, customFieldValues: {},
        },
      });
      await prisma.appointment.create({
        data: {
          id: uuidv4(), tenantId, clientId, assignedUserId: staffId,
          scheduledAt: new Date(Date.now() + 86400000), status: 'SCHEDULED',
        },
      });
      // A past appointment is history, not a handover concern.
      await prisma.appointment.create({
        data: {
          id: uuidv4(), tenantId, clientId, assignedUserId: staffId,
          scheduledAt: new Date(Date.now() - 86400000), status: 'COMPLETED',
        },
      });

      const res = await request(app)
        .get(`/api/${slug}/auth/staff/${staffId}/deactivation-impact`)
        .set('Cookie', [`jwt=${ownerToken}`]);

      expect(res.status).toBe(200);
      expect(res.body).toEqual({ clients: 1, upcomingAppointments: 1 });
    });

    it('is Business-Owner-only', async () => {
      await request(app)
        .get(`/api/${slug}/auth/staff/${staffId}/deactivation-impact`)
        .set('Cookie', [`jwt=${staffToken}`])
        .expect(403);
    });
  });

  describe('assignments survive deactivation', () => {
    it('leaves assigned clients and appointments pointing at the deactivated user', async () => {
      const clientId = uuidv4();
      await prisma.client.create({
        data: {
          id: clientId, tenantId, name: 'Held Client', status: ClientStatus.ACTIVE,
          assignedUserId: staffId, lastUpdatedByUserId: staffId, customFieldValues: {},
        },
      });

      await deactivate(staffId, ownerToken).expect(200);

      // History stays truthful about who held the work; reassignment is a
      // separate, deliberate step.
      const client = await prisma.client.findUnique({ where: { id: clientId } });
      expect(client?.assignedUserId).toBe(staffId);

      // And the user row itself is retained, not deleted.
      const user = await prisma.user.findUnique({ where: { id: staffId } });
      expect(user).not.toBeNull();
      expect(user?.isActive).toBe(false);
    });
  });
});
