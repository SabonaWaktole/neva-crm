import request from 'supertest';
import { createApp } from '../../../src/main/app';
import { PrismaClient } from '@prisma/client';
import { JwtTokenService } from '../../../src/auth/infrastructure/JwtTokenService';
import { v4 as uuidv4 } from 'uuid';

/**
 * Tenant scoping is absolute — no role is exempt.
 *
 * SUPER_ADMIN is a platform-level role: it administers tenants themselves (e.g.
 * GET /api/tenants), never an individual business's operational data. It used to
 * be exempted from the check in resolveTenant, which did not grant it working
 * access so much as let it past the guard into controllers that then
 * dereferenced its null tenantId — producing 500s. These tests pin the intended
 * behaviour: a clean 403 from the guard, on every tenant-scoped module.
 */
describe('Tenant scope enforcement across modules', () => {
  let app: any;
  let prisma: PrismaClient;
  let tokenService: JwtTokenService;

  let tenant1Id: string;
  let tenant2Id: string;
  let owner1Token: string;
  let staff1Token: string;
  let owner2Token: string;
  let superAdminToken: string;

  // One representative endpoint per tenant-scoped module.
  const endpoints = [
    { module: 'Clients', path: (slug: string) => `/api/${slug}/clients/search` },
    { module: 'Appointments', path: (slug: string) => `/api/${slug}/appointments/search` },
    { module: 'Inventory', path: (slug: string) => `/api/${slug}/inventory/warehouses` },
    { module: 'Quotations', path: (slug: string) => `/api/${slug}/quotations` },
  ];

  beforeAll(async () => {
    prisma = new PrismaClient();
    await prisma.$connect();
    app = createApp();
    tokenService = new JwtTokenService();
  }, 60000);

  afterAll(async () => {
    await prisma.$disconnect();
  });

  // Every fixture this file creates is tracked so cleanup can be scoped to
  // exactly those rows. Deliberately NOT using unscoped deleteMany({}): that
  // pattern (see TD-001) truncates whole tables and is only safe because Jest
  // runs suites sequentially within a worker — a property of the runner, not a
  // guarantee. A new file has no convention to preserve, so it should not add
  // another site to migrate later.
  let createdUserIds: string[] = [];

  beforeEach(async () => {
    tenant1Id = uuidv4();
    tenant2Id = uuidv4();

    await prisma.tenant.create({ data: { id: tenant1Id, name: 'Tenant 1', urlSlug: 'tenant1' } });
    await prisma.tenant.create({ data: { id: tenant2Id, name: 'Tenant 2', urlSlug: 'tenant2' } });

    const owner1 = await prisma.user.create({
      data: { id: uuidv4(), tenantId: tenant1Id, email: 'owner1@test.com', hashedPassword: 'hash', role: 'BUSINESS_OWNER' },
    });
    const staff1 = await prisma.user.create({
      data: { id: uuidv4(), tenantId: tenant1Id, email: 'staff1@test.com', hashedPassword: 'hash', role: 'STAFF' },
    });
    const owner2 = await prisma.user.create({
      data: { id: uuidv4(), tenantId: tenant2Id, email: 'owner2@test.com', hashedPassword: 'hash', role: 'BUSINESS_OWNER' },
    });
    // A SUPER_ADMIN has no tenant at all — that null is precisely what used to
    // reach the controllers once the guard let it through.
    const superAdmin = await prisma.user.create({
      data: { id: uuidv4(), tenantId: null, email: 'super@platform.com', hashedPassword: 'hash', role: 'SUPER_ADMIN' },
    });

    owner1Token = tokenService.sign({ userId: owner1.id, tenantId: tenant1Id, tenantSlug: 'tenant1', role: 'BUSINESS_OWNER', warehouseId: null });
    staff1Token = tokenService.sign({ userId: staff1.id, tenantId: tenant1Id, tenantSlug: 'tenant1', role: 'STAFF', warehouseId: null });
    owner2Token = tokenService.sign({ userId: owner2.id, tenantId: tenant2Id, tenantSlug: 'tenant2', role: 'BUSINESS_OWNER', warehouseId: null });
    superAdminToken = tokenService.sign({ userId: superAdmin.id, tenantId: null, tenantSlug: null, role: 'SUPER_ADMIN', warehouseId: null });

    // The SUPER_ADMIN has a null tenantId, so it cannot be cleaned up by tenant
    // scope — track user ids explicitly.
    createdUserIds = [owner1.id, staff1.id, owner2.id, superAdmin.id];

    await prisma.warehouse.create({ data: { id: uuidv4(), tenantId: tenant1Id, name: 'T1 WH', address: '1 A St' } });
  });

  afterEach(async () => {
    // Scoped teardown, children before parents. Only rows this file created.
    const tenantIds = [tenant1Id, tenant2Id];
    await prisma.warehouse.deleteMany({ where: { tenantId: { in: tenantIds } } });
    await prisma.user.deleteMany({ where: { id: { in: createdUserIds } } });
    await prisma.tenant.deleteMany({ where: { id: { in: tenantIds } } });
    createdUserIds = [];
  });

  describe('SUPER_ADMIN is denied on every tenant-scoped module', () => {
    endpoints.forEach(({ module, path }) => {
      it(`returns 403 (not 500, not empty 200) for SUPER_ADMIN on ${module}`, async () => {
        const res = await request(app)
          .get(path('tenant1'))
          .set('Authorization', `Bearer ${superAdminToken}`);

        expect(res.status).toBe(403);
        expect(res.body).toEqual({ error: 'Cross-tenant access forbidden' });
      });
    });

    it('denies SUPER_ADMIN with a 403 rather than crashing on its null tenantId', async () => {
      // Guards the specific regression: the old exemption produced 500s from a
      // non-null assertion on req.user.tenantId deeper in the stack.
      for (const { path } of endpoints) {
        const res = await request(app)
          .get(path('tenant1'))
          .set('Authorization', `Bearer ${superAdminToken}`);

        expect(res.status).not.toBe(500);
        expect(res.status).toBe(403);
      }
    });
  });

  describe('normal tenant access is unaffected', () => {
    it('allows a BUSINESS_OWNER to read their own tenant', async () => {
      const res = await request(app)
        .get('/api/tenant1/inventory/warehouses')
        .set('Authorization', `Bearer ${owner1Token}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body).toHaveLength(1);
    });

    it('allows a STAFF member to read their own tenant', async () => {
      const res = await request(app)
        .get('/api/tenant1/inventory/warehouses')
        .set('Authorization', `Bearer ${staff1Token}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    endpoints.forEach(({ module, path }) => {
      it(`allows a BUSINESS_OWNER through the guard on ${module}`, async () => {
        const res = await request(app)
          .get(path('tenant1'))
          .set('Authorization', `Bearer ${owner1Token}`);

        // The guard must not deny; the endpoint itself may legitimately 200.
        expect(res.status).not.toBe(403);
        expect(res.status).not.toBe(500);
      });
    });
  });

  describe('cross-tenant isolation still holds (existing guarantee)', () => {
    endpoints.forEach(({ module, path }) => {
      it(`returns 403 when a Tenant 2 owner targets Tenant 1 on ${module}`, async () => {
        const res = await request(app)
          .get(path('tenant1'))
          .set('Authorization', `Bearer ${owner2Token}`);

        expect(res.status).toBe(403);
        expect(res.body).toEqual({ error: 'Cross-tenant access forbidden' });
      });
    });

    it('returns 403 when a Tenant 1 owner targets Tenant 2', async () => {
      const res = await request(app)
        .get('/api/tenant2/inventory/warehouses')
        .set('Authorization', `Bearer ${owner1Token}`);

      expect(res.status).toBe(403);
    });
  });
});
