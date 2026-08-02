import request from 'supertest';
import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import { createApp } from '../../../src/main/app';
import { JwtTokenService } from '../../../src/auth/infrastructure/JwtTokenService';
import { BcryptPasswordHasher } from '../../../src/auth/infrastructure/BcryptPasswordHasher';

/**
 * The platform console's Settings page: platform-wide defaults for NEWLY
 * provisioned workspaces, and bulk-apply directly onto selected existing
 * ones. The two must stay observably distinct — see the assertions below that
 * changing the platform default does NOT touch an already-existing tenant.
 */
describe('Platform settings', () => {
  let app: any;
  let prisma: PrismaClient;
  let tokenService: JwtTokenService;
  const hasher = new BcryptPasswordHasher();

  let superAdminId: string;
  let superAdminToken: string;
  let ownerId: string;
  let ownerToken: string;
  let staffToken: string;

  let tenantAId: string;
  let tenantBId: string;
  let slugA: string;
  let slugB: string;

  const createdTenantIds: string[] = [];

  beforeAll(async () => {
    prisma = new PrismaClient();
    await prisma.$connect();
    app = createApp();
    tokenService = new JwtTokenService();
  }, 60000);

  beforeEach(async () => {
    tenantAId = uuidv4();
    tenantBId = uuidv4();
    slugA = `pf-a-${uuidv4()}`;
    slugB = `pf-b-${uuidv4()}`;
    createdTenantIds.push(tenantAId, tenantBId);

    await prisma.tenant.createMany({
      data: [
        { id: tenantAId, name: 'Platform Settings A', urlSlug: slugA, currency: 'USD' },
        { id: tenantBId, name: 'Platform Settings B', urlSlug: slugB, currency: 'USD' },
      ],
    });

    superAdminId = uuidv4();
    ownerId = uuidv4();
    const staffId = uuidv4();
    const hashed = await hasher.hash('Password1');

    await prisma.user.createMany({
      data: [
        { id: superAdminId, email: `sa-${uuidv4()}@t.com`, hashedPassword: hashed, role: 'SUPER_ADMIN' },
        { id: ownerId, email: `owner-${uuidv4()}@t.com`, hashedPassword: hashed, role: 'BUSINESS_OWNER', tenantId: tenantAId },
        { id: staffId, email: `staff-${uuidv4()}@t.com`, hashedPassword: hashed, role: 'STAFF', tenantId: tenantAId },
      ],
    });

    superAdminToken = tokenService.sign({
      userId: superAdminId,
      role: 'SUPER_ADMIN',
      tenantId: null,
      tenantSlug: null,
      warehouseId: null,
    });
    ownerToken = tokenService.sign({
      userId: ownerId,
      role: 'BUSINESS_OWNER',
      tenantId: tenantAId,
      tenantSlug: slugA,
      warehouseId: null,
    });
    staffToken = tokenService.sign({
      userId: staffId,
      role: 'STAFF',
      tenantId: tenantAId,
      tenantSlug: slugA,
      warehouseId: null,
    });
  });

  afterAll(async () => {
    await prisma.tenant.deleteMany({ where: { id: { in: createdTenantIds } } });
    await prisma.user.deleteMany({ where: { tenantId: { in: createdTenantIds } } });
    await prisma.user.deleteMany({ where: { id: superAdminId } });
    await prisma.platformSettings.deleteMany({});
    await prisma.$disconnect();
  });

  describe('GET/PUT /api/platform-settings', () => {
    it('SUPER_ADMIN reads the shipped defaults before anything is ever saved', async () => {
      const res = await request(app)
        .get('/api/platform-settings')
        .set('Cookie', [`jwt=${superAdminToken}`]);

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({ currency: 'USD', locale: 'en-US' });
    });

    it('SUPER_ADMIN can change the platform default', async () => {
      const res = await request(app)
        .put('/api/platform-settings')
        .set('Cookie', [`jwt=${superAdminToken}`])
        .send({ currency: 'EUR', requiresQuotationApproval: false });

      expect(res.status).toBe(200);
      expect(res.body.currency).toBe('EUR');
      expect(res.body.requiresQuotationApproval).toBe(false);

      const reread = await request(app)
        .get('/api/platform-settings')
        .set('Cookie', [`jwt=${superAdminToken}`]);
      expect(reread.body.currency).toBe('EUR');
    });

    it.each([
      ['a Business Owner', () => ownerToken],
      ['Staff', () => staffToken],
    ])('refuses %s — this is platform-level, not a workspace setting', async (_label, getToken) => {
      const res = await request(app)
        .put('/api/platform-settings')
        .set('Cookie', [`jwt=${getToken()}`])
        .send({ currency: 'EUR' });
      expect(res.status).toBe(403);
    });

    it('rejects an unknown currency code', async () => {
      const res = await request(app)
        .put('/api/platform-settings')
        .set('Cookie', [`jwt=${superAdminToken}`])
        .send({ currency: 'NOTREAL' });
      expect(res.status).toBe(400);
    });

    // The defining guarantee: changing the default must never reach back and
    // move an ALREADY-EXISTING workspace's currency out from under it.
    it('does not retroactively change an existing tenant', async () => {
      await request(app)
        .put('/api/platform-settings')
        .set('Cookie', [`jwt=${superAdminToken}`])
        .send({ currency: 'GBP' });

      const tenant = await prisma.tenant.findUnique({ where: { id: tenantAId } });
      expect(tenant?.currency).toBe('USD');
    });

    it('a newly provisioned tenant picks up the current platform default', async () => {
      await request(app)
        .put('/api/platform-settings')
        .set('Cookie', [`jwt=${superAdminToken}`])
        .send({ currency: 'JPY', timezone: 'Asia/Tokyo' });

      const newSlug = `pf-new-${uuidv4()}`;
      const created = await request(app)
        .post('/api/tenants')
        .set('Cookie', [`jwt=${superAdminToken}`])
        .send({
          companyName: 'Freshly Provisioned',
          urlSlug: newSlug,
          ownerEmail: `fresh-${uuidv4()}@t.com`,
          ownerPassword: 'Password1',
        });

      expect(created.status).toBe(201);
      createdTenantIds.push(created.body.tenant.id);

      const stored = await prisma.tenant.findUnique({ where: { id: created.body.tenant.id } });
      expect(stored?.currency).toBe('JPY');
      expect(stored?.timezone).toBe('Asia/Tokyo');
    });
  });

  describe('PUT /api/tenants/bulk-settings', () => {
    it('applies settings to exactly the selected tenants and no others', async () => {
      const res = await request(app)
        .put('/api/tenants/bulk-settings')
        .set('Cookie', [`jwt=${superAdminToken}`])
        .send({ tenantIds: [tenantAId, tenantBId], settings: { currency: 'CAD' } });

      expect(res.status).toBe(200);
      expect(res.body.updatedCount).toBe(2);

      const [a, b] = await Promise.all([
        prisma.tenant.findUnique({ where: { id: tenantAId } }),
        prisma.tenant.findUnique({ where: { id: tenantBId } }),
      ]);
      expect(a?.currency).toBe('CAD');
      expect(b?.currency).toBe('CAD');
    });

    it('touches only the tenants actually selected', async () => {
      await request(app)
        .put('/api/tenants/bulk-settings')
        .set('Cookie', [`jwt=${superAdminToken}`])
        .send({ tenantIds: [tenantAId], settings: { currency: 'AUD' } });

      const [a, b] = await Promise.all([
        prisma.tenant.findUnique({ where: { id: tenantAId } }),
        prisma.tenant.findUnique({ where: { id: tenantBId } }),
      ]);
      expect(a?.currency).toBe('AUD');
      expect(b?.currency).toBe('USD');
    });

    it('rejects an empty tenant selection rather than silently doing nothing', async () => {
      const res = await request(app)
        .put('/api/tenants/bulk-settings')
        .set('Cookie', [`jwt=${superAdminToken}`])
        .send({ tenantIds: [], settings: { currency: 'CAD' } });
      expect(res.status).toBe(400);
    });

    it('refuses a Business Owner — bulk apply is platform-level', async () => {
      const res = await request(app)
        .put('/api/tenants/bulk-settings')
        .set('Cookie', [`jwt=${ownerToken}`])
        .send({ tenantIds: [tenantAId], settings: { currency: 'CAD' } });
      expect(res.status).toBe(403);

      const a = await prisma.tenant.findUnique({ where: { id: tenantAId } });
      expect(a?.currency).toBe('USD');
    });
  });
});
