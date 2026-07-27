import request from 'supertest';
import { createApp } from '../../../src/main/app';
import { PrismaClient } from '@prisma/client';
import { JwtTokenService } from '../../../src/auth/infrastructure/JwtTokenService';

const prisma = new PrismaClient();
const tokenService = new JwtTokenService();
const app = createApp();

describe('Tenant Routes (Integration)', () => {
  const tenantId = 't-tenant-routes';
  let superAdminToken: string;
  let businessOwnerToken: string;
  let staffToken: string;

  beforeAll(async () => {
    await prisma.tenant.create({
      data: { id: tenantId, name: 'Tenant Routes Test', urlSlug: 't-tenant-routes' },
    });

    const saId = 'u-sa-routes';
    const boId = 'u-bo-routes';
    const stId = 'u-st-routes';

    await prisma.user.createMany({
      data: [
        { id: saId, email: 'sa@test.com', hashedPassword: 'pwd', role: 'SUPER_ADMIN' },
        { id: boId, email: 'bo@test.com', hashedPassword: 'pwd', role: 'BUSINESS_OWNER', tenantId },
        { id: stId, email: 'st@test.com', hashedPassword: 'pwd', role: 'STAFF', tenantId },
      ],
    });

    superAdminToken = tokenService.sign({ userId: saId, role: 'SUPER_ADMIN', tenantId: null, tenantSlug: null, warehouseId: null });
    businessOwnerToken = tokenService.sign({ userId: boId, role: 'BUSINESS_OWNER', tenantId, tenantSlug: 't-tenant-routes', warehouseId: null });
    staffToken = tokenService.sign({ userId: stId, role: 'STAFF', tenantId, tenantSlug: 't-tenant-routes', warehouseId: null });
  });

  afterAll(async () => {
    await prisma.interaction.deleteMany({});
    await prisma.appointment.deleteMany({});
    await prisma.client.deleteMany({});
    await prisma.customFieldDefinition.deleteMany({});
    await prisma.passwordResetToken.deleteMany({});
    await prisma.notification.deleteMany({});
    await prisma.user.deleteMany({});
    await prisma.outcomeCategory.deleteMany({});
    await prisma.tenant.deleteMany({ where: { id: tenantId } });
    await prisma.$disconnect();
  });

  it('GET /api/tenants should return 401 if unauthenticated', async () => {
    const response = await request(app).get('/api/tenants');
    expect(response.status).toBe(401);
  });

  it('GET /api/tenants should return 403 if BUSINESS_OWNER', async () => {
    const response = await request(app)
      .get('/api/tenants')
      .set('Cookie', [`jwt=${businessOwnerToken}`]);
    expect(response.status).toBe(403);
  });

  it('GET /api/tenants should return 403 if STAFF', async () => {
    const response = await request(app)
      .get('/api/tenants')
      .set('Cookie', [`jwt=${staffToken}`]);
    expect(response.status).toBe(403);
  });

  it('GET /api/tenants should return 200 with tenants if SUPER_ADMIN', async () => {
    const response = await request(app)
      .get('/api/tenants')
      .set('Cookie', [`jwt=${superAdminToken}`]);
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('items');
    expect(response.body).toHaveProperty('total');
    expect(Array.isArray(response.body.items)).toBe(true);
    // At least the one we just created should be there
    expect(response.body.total).toBeGreaterThanOrEqual(1);
    expect(response.body.items.some((t: any) => t.id === tenantId)).toBe(true);
  });
});
