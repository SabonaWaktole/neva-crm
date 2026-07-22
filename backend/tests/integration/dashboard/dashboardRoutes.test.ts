import request from 'supertest';
import { createApp } from '../../../src/main/app';
import { PrismaClient } from '@prisma/client';
import { JwtTokenService } from '../../../src/auth/infrastructure/JwtTokenService';
import { ClientStatus } from '../../../src/clients/domain/enums/ClientStatus';
import { randomUUID } from 'crypto';

const prisma = new PrismaClient();
const tokenService = new JwtTokenService();
const app = createApp();

describe('Dashboard Routes (Integration)', () => {
  const tenant1Id = 't-dash-1';
  const tenant2Id = 't-dash-2';
  let t1BusinessOwnerToken: string;
  let t1StaffToken: string;
  let t2BusinessOwnerToken: string;

  beforeAll(async () => {
    await prisma.tenant.createMany({
      data: [
        { id: tenant1Id, name: 'Dash Tenant 1', urlSlug: 't-dash-1' },
        { id: tenant2Id, name: 'Dash Tenant 2', urlSlug: 't-dash-2' },
      ],
      skipDuplicates: true,
    });

    const t1BoId = 'u-dash-t1-bo';
    const t1StId = 'u-dash-t1-st';
    const t2BoId = 'u-dash-t2-bo';

    await prisma.user.createMany({
      data: [
        { id: t1BoId, email: 'bo1@dash.com', hashedPassword: 'pwd', role: 'BUSINESS_OWNER', tenantId: tenant1Id },
        { id: t1StId, email: 'st1@dash.com', hashedPassword: 'pwd', role: 'STAFF', tenantId: tenant1Id },
        { id: t2BoId, email: 'bo2@dash.com', hashedPassword: 'pwd', role: 'BUSINESS_OWNER', tenantId: tenant2Id },
      ],
      skipDuplicates: true,
    });

    t1BusinessOwnerToken = tokenService.sign({ userId: t1BoId, role: 'BUSINESS_OWNER', tenantId: tenant1Id, tenantSlug: 't-dash-1', warehouseId: null });
    t1StaffToken = tokenService.sign({ userId: t1StId, role: 'STAFF', tenantId: tenant1Id, tenantSlug: 't-dash-1', warehouseId: null });
    t2BusinessOwnerToken = tokenService.sign({ userId: t2BoId, role: 'BUSINESS_OWNER', tenantId: tenant2Id, tenantSlug: 't-dash-2', warehouseId: null });

    // Seed some basic data so metrics aren't zero
    await prisma.client.createMany({
      data: [
        {
          id: randomUUID(),
          tenantId: tenant1Id,
          name: 'Dash Client',
          status: ClientStatus.PROSPECT,
          lastUpdatedByUserId: t1BoId,
          customFieldValues: {},
        },
        {
          id: randomUUID(),
          tenantId: tenant2Id,
          name: 'Tenant 2 Client Leak Test',
          status: ClientStatus.PROSPECT,
          lastUpdatedByUserId: t2BoId,
          customFieldValues: {},
        }
      ]
    });
  });

  afterAll(async () => {
    await prisma.interaction.deleteMany({});
    await prisma.appointment.deleteMany({});
    await prisma.client.deleteMany({});
    await prisma.customFieldDefinition.deleteMany({});
    await prisma.passwordResetToken.deleteMany({});
    await prisma.user.deleteMany({});
    await prisma.outcomeCategory.deleteMany({});
    await prisma.tenant.deleteMany({ where: { id: { in: [tenant1Id, tenant2Id] } } });
    await prisma.$disconnect();
  });

  describe('GET /api/:tenantSlug/dashboard/metrics', () => {
    it('returns 200 and metrics for BUSINESS_OWNER', async () => {
      const response = await request(app)
        .get(`/api/t-dash-1/dashboard/metrics`)
        .set('Cookie', [`jwt=${t1BusinessOwnerToken}`]);
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('totalClients');
      expect(response.body.totalClients).toBe(1);
    });

    it('returns 200 and metrics for STAFF', async () => {
      const response = await request(app)
        .get(`/api/t-dash-1/dashboard/metrics`)
        .set('Cookie', [`jwt=${t1StaffToken}`]);
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('totalClients');
      expect(response.body.totalClients).toBe(1);
    });

    it('returns 403 when Tenant 2 tries to access Tenant 1 metrics', async () => {
      const response = await request(app)
        .get(`/api/t-dash-1/dashboard/metrics`)
        .set('Cookie', [`jwt=${t2BusinessOwnerToken}`]);
      
      expect(response.status).toBe(403);
    });
  });

  describe('GET /api/:tenantSlug/dashboard/feed', () => {
    it('returns 200 and timeline for BUSINESS_OWNER without leaking other tenants data', async () => {
      const response = await request(app)
        .get(`/api/t-dash-1/dashboard/feed?limit=5`)
        .set('Cookie', [`jwt=${t1BusinessOwnerToken}`]);
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('timeline');
      expect(Array.isArray(response.body.timeline)).toBe(true);
      // We inserted 1 client for T1 and 1 client for T2, so we should have exactly 1 item
      expect(response.body.timeline.length).toBe(1);
      expect(response.body.timeline[0].type).toBe('CLIENT_CREATED');
      // Assert that the returned data is strictly Tenant 1's data
      const jsonStr = JSON.stringify(response.body.timeline);
      expect(jsonStr).not.toContain('Tenant 2 Client Leak Test');
    });

    it('returns 403 when Tenant 2 tries to access Tenant 1 feed', async () => {
      const response = await request(app)
        .get(`/api/t-dash-1/dashboard/feed`)
        .set('Cookie', [`jwt=${t2BusinessOwnerToken}`]);
      
      expect(response.status).toBe(403);
    });
  });
});
