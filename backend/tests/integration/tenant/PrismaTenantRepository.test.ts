import { PrismaClient } from '@prisma/client';
import { PrismaTenantRepository } from '../../../src/tenant/infrastructure/repositories/PrismaTenantRepository';
import { Tenant } from '../../../src/tenant/domain/entities/Tenant';
import { randomUUID } from 'crypto';

const prisma = new PrismaClient();

describe('PrismaTenantRepository Integration', () => {
  let repo: PrismaTenantRepository;
  const tenantIds: string[] = [];

  beforeAll(async () => {
    repo = new PrismaTenantRepository();

    // Clear all existing data to ensure total is exactly 15
    await prisma.stockMovement.deleteMany({});
    await prisma.stockLevel.deleteMany({});
    await prisma.product.deleteMany({});
    await prisma.warehouse.deleteMany({});
    await prisma.category.deleteMany({});
    await prisma.interaction.deleteMany({});
    await prisma.appointment.deleteMany({});
    await prisma.client.deleteMany({});
    await prisma.customFieldDefinition.deleteMany({});
    await prisma.passwordResetToken.deleteMany({});
    await prisma.invitation.deleteMany({});
    await prisma.user.deleteMany({});
    await prisma.outcomeCategory.deleteMany({});
    await prisma.tenant.deleteMany({});

    // Seed 15 tenants with sequential createdAt dates to ensure consistent ordering
    // i=0 is the newest, i=14 is the oldest
    const tenantsData = Array.from({ length: 15 }).map((_, i) => {
      const id = `t-repo-${randomUUID()}`;
      tenantIds.push(id);
      return {
        id,
        name: `Tenant ${i}`,
        urlSlug: `tenant-slug-${id}`,
        createdAt: new Date(Date.now() - i * 10000),
      };
    });

    for (const t of tenantsData) {
      await prisma.tenant.create({ data: t });
    }
  });

  afterAll(async () => {
    await prisma.stockMovement.deleteMany({});
    await prisma.stockLevel.deleteMany({});
    await prisma.product.deleteMany({});
    await prisma.warehouse.deleteMany({});
    await prisma.category.deleteMany({});
    await prisma.interaction.deleteMany({});
    await prisma.appointment.deleteMany({});
    await prisma.client.deleteMany({});
    await prisma.customFieldDefinition.deleteMany({});
    await prisma.passwordResetToken.deleteMany({});
    await prisma.user.deleteMany({});
    await prisma.outcomeCategory.deleteMany({});
    await prisma.tenant.deleteMany({
      where: { id: { in: tenantIds } },
    });
    await prisma.$disconnect();
  });

  it('proves #1: findAll(0, 5) returns the first 5 tenants ordered by createdAt descending, and total is 15', async () => {
    const result = await repo.findAll(0, 5);
    
    expect(result.items.length).toBe(5);
    expect(result.total).toBe(15);

    // Verify ordering (newest first)
    for (let i = 0; i < result.items.length - 1; i++) {
      const current = result.items[i];
      const next = result.items[i + 1];
      expect(current.createdAt.getTime()).toBeGreaterThanOrEqual(next.createdAt.getTime());
    }

    // Verify correct items are returned (first 5)
    expect(result.items[0].name).toBe('Tenant 0');
    expect(result.items[4].name).toBe('Tenant 4');
    
    // Ensure domain entity mapping
    expect(result.items[0]).toBeInstanceOf(Tenant);
  });

  it('proves #2: findAll(5, 5) returns the next 5 tenants', async () => {
    const result = await repo.findAll(5, 5);
    
    expect(result.items.length).toBe(5);

    // Verify ordering
    for (let i = 0; i < result.items.length - 1; i++) {
      const current = result.items[i];
      const next = result.items[i + 1];
      expect(current.createdAt.getTime()).toBeGreaterThanOrEqual(next.createdAt.getTime());
    }

    // Verify the next chunk is returned (items 5 to 9)
    expect(result.items[0].name).toBe('Tenant 5');
    expect(result.items[4].name).toBe('Tenant 9');
  });
});
