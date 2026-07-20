import request from 'supertest';
import { createApp } from '../../../src/main/app';
import { PrismaClient } from '@prisma/client';
import { JwtTokenService } from '../../../src/auth/infrastructure/JwtTokenService';
import { v4 as uuidv4 } from 'uuid';

describe('Inventory End-to-End User Flow', () => {
  let app: any;
  let prisma: PrismaClient;
  let tokenService: JwtTokenService;

  let tenantId: string;
  let ownerToken: string;
  let warehouse1Id: string;
  let warehouse2Id: string;
  let categoryId: string;
  let productId: string;
  
  beforeAll(async () => {
    prisma = new PrismaClient();
    await prisma.$connect();
    app = createApp();
    tokenService = new JwtTokenService();

    // Clean up
    await prisma.stockMovement.deleteMany();
    await prisma.stockLevel.deleteMany();
    await prisma.product.deleteMany();
    await prisma.warehouse.deleteMany();
    await prisma.category.deleteMany();
    await prisma.interaction.deleteMany();
    await prisma.appointment.deleteMany();
    await prisma.client.deleteMany();
    await prisma.user.deleteMany();
    await prisma.tenant.deleteMany();

    tenantId = uuidv4();
    await prisma.tenant.create({
      data: { id: tenantId, name: 'E2E Tenant', urlSlug: 'e2e-tenant' }
    });

    const ownerId = uuidv4();
    await prisma.user.create({
      data: {
        id: ownerId,
        email: 'e2e@example.com',
        hashedPassword: 'hash',
        role: 'BUSINESS_OWNER',
        tenantId
      }
    });

    ownerToken = tokenService.sign({
      userId: ownerId,
      role: 'BUSINESS_OWNER' as any,
      tenantId,
      tenantSlug: 'e2e-tenant'
    });
  });

  afterAll(async () => {
    await prisma.stockMovement.deleteMany();
    await prisma.stockLevel.deleteMany();
    await prisma.product.deleteMany();
    await prisma.warehouse.deleteMany();
    await prisma.category.deleteMany();
    await prisma.user.deleteMany();
    await prisma.tenant.deleteMany();
    await prisma.$disconnect();
  });

  it('1. Create Warehouse 1 (Origin)', async () => {
    const res = await request(app)
      .post('/api/e2e-tenant/inventory/warehouses')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ name: 'Origin Hub', address: '123 Main St' });

    expect(res.status).toBe(201);
    warehouse1Id = res.body.id;
  });

  it('2. Create Warehouse 2 (Destination)', async () => {
    const res = await request(app)
      .post('/api/e2e-tenant/inventory/warehouses')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ name: 'Dest Hub', address: '456 Cross St' });

    expect(res.status).toBe(201);
    warehouse2Id = res.body.id;
  });

  it('3. Create Category', async () => {
    const res = await request(app)
      .post('/api/e2e-tenant/inventory/categories')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ name: 'Electronics', description: 'Gadgets' });

    expect(res.status).toBe(201);
    categoryId = res.body.id;
  });

  it('4. Create Product with initial stock in Warehouse 1', async () => {
    const res = await request(app)
      .post('/api/e2e-tenant/inventory/products')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({
        name: 'Smartphone',
        description: 'Latest model',
        price: 999,
        categoryId,
        initialStock: [
          { warehouseId: warehouse1Id, quantity: 100 },
          { warehouseId: warehouse2Id, quantity: 0 }
        ]
      });

    expect(res.status).toBe(201);
    productId = res.body.product.id;
  });

  it('5. Adjust stock (add 50) in Warehouse 1', async () => {
    const res = await request(app)
      .post(`/api/e2e-tenant/inventory/products/${productId}/adjust`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({
        warehouseId: warehouse1Id,
        quantityChange: 50,
        reason: 'Restock'
      });

    expect(res.status).toBe(200);

    // Verify Product total units updated to 150
    const prodRes = await request(app)
      .get(`/api/e2e-tenant/inventory/products?name=Smart`)
      .set('Authorization', `Bearer ${ownerToken}`);
    expect(prodRes.body[0].totalStock).toBe(150);
  });

  it('6. Transfer stock (75) from Warehouse 1 to Warehouse 2', async () => {
    const res = await request(app)
      .post(`/api/e2e-tenant/inventory/products/${productId}/transfer`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({
        fromWarehouseId: warehouse1Id,
        toWarehouseId: warehouse2Id,
        quantity: 75,
        reason: 'Rebalancing'
      });

    expect(res.status).toBe(200);
  });

  it('7. Verify MultiLocationStock breakdown (Warehouse 1 = 75, Warehouse 2 = 75)', async () => {
    const res = await request(app)
      .get(`/api/e2e-tenant/inventory/products/${productId}/stock-breakdown`)
      .set('Authorization', `Bearer ${ownerToken}`);

    expect(res.status).toBe(200);
    const breakdown = res.body.stockLevels; // Array of StockLevel with warehouse populated
    expect(breakdown).toHaveLength(2);
    
    const wh1 = breakdown.find((b: any) => b.warehouseId === warehouse1Id);
    const wh2 = breakdown.find((b: any) => b.warehouseId === warehouse2Id);

    expect(wh1.quantity).toBe(75); // 100 + 50 - 75
    expect(wh2.quantity).toBe(75); // 0 + 75
    expect(wh1.warehouseId).toBe(warehouse1Id);
    expect(wh2.warehouseId).toBe(warehouse2Id);
  });
});
