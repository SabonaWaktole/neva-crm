import request from 'supertest';
import { createApp } from '../../../src/main/app';
import { PrismaClient } from '@prisma/client';
import { JwtTokenService } from '../../../src/auth/infrastructure/JwtTokenService';
import { v4 as uuidv4 } from 'uuid';

describe('Inventory Routes Integration - GetWarehouses & GetCategories', () => {
  let app: any;
  let prisma: PrismaClient;
  let tokenService: JwtTokenService;

  let tenant1Id: string;
  let tenant2Id: string;
  let owner1Token: string;
  let staff1Token: string;
  let owner2Token: string;
  
  beforeAll(async () => {
    prisma = new PrismaClient();
    await prisma.$connect();
    
    // Create the app with real repos
    app = createApp();
    tokenService = new JwtTokenService();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    // Clean up
    await prisma.stockMovement.deleteMany();
    await prisma.productImage.deleteMany();
    await prisma.stockLevel.deleteMany();
    await prisma.product.deleteMany();
    await prisma.warehouse.deleteMany();
    await prisma.category.deleteMany();
    await prisma.notification.deleteMany();
    await prisma.user.deleteMany();
    // Integrations hold a RESTRICT reference to Tenant; without clearing them
    // first the tenant delete aborts and every test in this file fails setup.
    await prisma.integration.deleteMany();
    await prisma.tenant.deleteMany();

    tenant1Id = uuidv4();
    tenant2Id = uuidv4();

    // Create Tenant 1
    const t1 = await prisma.tenant.create({ data: { id: tenant1Id, name: 'Tenant 1', urlSlug: 'tenant1' } });
    
    // Create Tenant 2
    const t2 = await prisma.tenant.create({ data: { id: tenant2Id, name: 'Tenant 2', urlSlug: 'tenant2' } });

    // Create Users
    const owner1 = await prisma.user.create({ data: { id: uuidv4(), tenantId: tenant1Id, email: 'owner1@test.com', hashedPassword: 'hash', role: 'BUSINESS_OWNER' } });
    const staff1 = await prisma.user.create({ data: { id: uuidv4(), tenantId: tenant1Id, email: 'staff1@test.com', hashedPassword: 'hash', role: 'STAFF' } });
    const owner2 = await prisma.user.create({ data: { id: uuidv4(), tenantId: tenant2Id, email: 'owner2@test.com', hashedPassword: 'hash', role: 'BUSINESS_OWNER' } });

    // Generate Tokens
    owner1Token = tokenService.sign({ userId: owner1.id, tenantId: tenant1Id, tenantSlug: 'tenant1', role: 'BUSINESS_OWNER', warehouseId: null });
    staff1Token = tokenService.sign({ userId: staff1.id, tenantId: tenant1Id, tenantSlug: 'tenant1', role: 'STAFF', warehouseId: null });
    owner2Token = tokenService.sign({ userId: owner2.id, tenantId: tenant2Id, tenantSlug: 'tenant2', role: 'BUSINESS_OWNER', warehouseId: null });

    // Seed Warehouses & Categories
    await prisma.warehouse.create({ data: { id: uuidv4(), tenantId: tenant1Id, name: 'T1 WH 1', address: '123 A' } });
    await prisma.warehouse.create({ data: { id: uuidv4(), tenantId: tenant1Id, name: 'T1 WH 2', address: '123 B' } });
    await prisma.warehouse.create({ data: { id: uuidv4(), tenantId: tenant2Id, name: 'T2 WH 1', address: '123 C' } });

    await prisma.category.create({ data: { id: uuidv4(), tenantId: tenant1Id, name: 'T1 Cat 1' } });
    await prisma.category.create({ data: { id: uuidv4(), tenantId: tenant2Id, name: 'T2 Cat 1' } });
    await prisma.category.create({ data: { id: uuidv4(), tenantId: tenant2Id, name: 'T2 Cat 2' } });
  });

  describe('GET /api/:tenantSlug/inventory/warehouses', () => {
    it('should return warehouses for tenant1 (Business Owner)', async () => {
      const res = await request(app)
        .get('/api/tenant1/inventory/warehouses')
        .set('Authorization', `Bearer ${owner1Token}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(2);
      expect(res.body.map((w: any) => w.name).sort()).toEqual(['T1 WH 1', 'T1 WH 2']);
    });

    it('should return warehouses for tenant1 (Staff)', async () => {
      const res = await request(app)
        .get('/api/tenant1/inventory/warehouses')
        .set('Authorization', `Bearer ${staff1Token}`);

      expect(res.status).toBe(200);
      // Staff see only their assigned warehouse; this one has none, so the
      // list is legitimately empty rather than the owner's full set.
      expect(res.body).toHaveLength(0);
    });

    it('should explicitly isolate warehouses by tenant (Tenant 2 Owner sees only T2 warehouses)', async () => {
      const res = await request(app)
        .get('/api/tenant2/inventory/warehouses')
        .set('Authorization', `Bearer ${owner2Token}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(1);
      expect(res.body[0].name).toBe('T2 WH 1');
    });
  });

  describe('GET /api/:tenantSlug/inventory/categories', () => {
    it('should return categories for tenant1 (Business Owner)', async () => {
      const res = await request(app)
        .get('/api/tenant1/inventory/categories')
        .set('Authorization', `Bearer ${owner1Token}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(1);
      expect(res.body[0].category.name).toBe('T1 Cat 1');
    });

    it('should return categories for tenant1 (Staff)', async () => {
      const res = await request(app)
        .get('/api/tenant1/inventory/categories')
        .set('Authorization', `Bearer ${staff1Token}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(1);
    });

    it('should explicitly isolate categories by tenant (Tenant 2 Owner sees only T2 categories)', async () => {
      const res = await request(app)
        .get('/api/tenant2/inventory/categories')
        .set('Authorization', `Bearer ${owner2Token}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(2);
      expect(res.body.map((c: any) => c.category.name).sort()).toEqual(['T2 Cat 1', 'T2 Cat 2']);
    });
  });
});
