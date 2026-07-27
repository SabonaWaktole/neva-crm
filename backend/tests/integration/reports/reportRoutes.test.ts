import request from 'supertest';
import { createApp } from '../../../src/main/app';
import { PrismaClient } from '@prisma/client';
import { JwtTokenService } from '../../../src/auth/infrastructure/JwtTokenService';
import { randomUUID } from 'crypto';

const prisma = new PrismaClient();
const tokenService = new JwtTokenService();
const app = createApp();

describe('Report Routes Integration', () => {
  const tenant1Id = 't-report-1';
  const tenant2Id = 't-report-2';
  let t1BusinessOwnerToken: string;
  let t1StaffToken: string;
  let t2BusinessOwnerToken: string;

  beforeAll(async () => {
    await prisma.tenant.createMany({
      data: [
        { id: tenant1Id, name: 'Report Tenant 1', urlSlug: 't-report-1' },
        { id: tenant2Id, name: 'Report Tenant 2', urlSlug: 't-report-2' },
      ],
      skipDuplicates: true,
    });

    const t1BoId = 'u-report-t1-bo';
    const t1StId = 'u-report-t1-st';
    const t2BoId = 'u-report-t2-bo';

    await prisma.user.createMany({
      data: [
        { id: t1BoId, email: 'bo1@report.com', hashedPassword: 'pwd', role: 'BUSINESS_OWNER', tenantId: tenant1Id },
        { id: t1StId, email: 'st1@report.com', hashedPassword: 'pwd', role: 'STAFF', tenantId: tenant1Id },
        { id: t2BoId, email: 'bo2@report.com', hashedPassword: 'pwd', role: 'BUSINESS_OWNER', tenantId: tenant2Id },
      ],
      skipDuplicates: true,
    });

    t1BusinessOwnerToken = tokenService.sign({ userId: t1BoId, role: 'BUSINESS_OWNER', tenantId: tenant1Id, tenantSlug: 't-report-1', warehouseId: null });
    t1StaffToken = tokenService.sign({ userId: t1StId, role: 'STAFF', tenantId: tenant1Id, tenantSlug: 't-report-1', warehouseId: null });
    t2BusinessOwnerToken = tokenService.sign({ userId: t2BoId, role: 'BUSINESS_OWNER', tenantId: tenant2Id, tenantSlug: 't-report-2', warehouseId: null });

    // Seed some data
    await prisma.client.createMany({
      data: [
        {
          id: randomUUID(),
          tenantId: tenant1Id,
          name: 'Client 1',
          status: 'ACTIVE',
          lastUpdatedByUserId: t1BoId,
          customFieldValues: {},
        },
        {
          id: randomUUID(),
          tenantId: tenant1Id,
          name: 'Client 2',
          status: 'PROSPECT',
          lastUpdatedByUserId: t1BoId,
          customFieldValues: {},
        },
      ],
      skipDuplicates: true,
    });
  });

  afterAll(async () => {
    // cleanup
    await prisma.client.deleteMany({ where: { tenantId: { in: [tenant1Id, tenant2Id] } } });
    await prisma.notification.deleteMany({ where: { tenantId: { in: [tenant1Id, tenant2Id] } } });
    await prisma.user.deleteMany({ where: { tenantId: { in: [tenant1Id, tenant2Id] } } });
    await prisma.tenant.deleteMany({ where: { id: { in: [tenant1Id, tenant2Id] } } });
    await prisma.$disconnect();
  });

  describe('GET /api/:tenantSlug/reports/clients', () => {
    it('should return client status distribution for business owner', async () => {
      const response = await request(app)
        .get(`/api/t-report-1/reports/clients`)
        .set('Authorization', `Bearer ${t1BusinessOwnerToken}`);

      expect(response.status).toBe(200);
      expect(response.body.clients).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ status: 'ACTIVE', count: 1 }),
          expect.objectContaining({ status: 'PROSPECT', count: 1 }),
        ])
      );
    });

    it('should return 403 for staff role', async () => {
      const response = await request(app)
        .get(`/api/t-report-1/reports/clients`)
        .set('Authorization', `Bearer ${t1StaffToken}`);

      expect(response.status).toBe(403);
    });
  });
});
