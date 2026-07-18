import { PrismaClient } from '@prisma/client';
import { PrismaClientRepository } from '../../../src/clients/infrastructure/repositories/PrismaClientRepository';
import { Client } from '../../../src/clients/domain/entities/Client';
import { ClientStatus } from '../../../src/clients/domain/enums/ClientStatus';
import { randomUUID } from 'crypto';

const prisma = new PrismaClient();

describe('PrismaClientRepository Integration', () => {
  let repo: PrismaClientRepository;
  const tenant1Id = 't-repo-1';
  const tenant2Id = 't-repo-2';
  const userId = 'u-repo-1';

  beforeAll(async () => {
    repo = new PrismaClientRepository(prisma);

    // Setup base dependencies
    await prisma.tenant.createMany({
      data: [
        { id: tenant1Id, name: 'Tenant 1', urlSlug: 't-repo-1' },
        { id: tenant2Id, name: 'Tenant 2', urlSlug: 't-repo-2' },
      ],
      skipDuplicates: true,
    });

    await prisma.user.createMany({
      data: [
        { id: userId, email: 'urepo@example.com', hashedPassword: 'pwd', role: 'BUSINESS_OWNER', tenantId: tenant1Id },
      ],
      skipDuplicates: true,
    });

    // Clean up existing clients for these tenants
    await prisma.client.deleteMany({ where: { tenantId: { in: [tenant1Id, tenant2Id] } } });

    // Seed 15 clients for tenant 1 with specific custom fields
    const clients = Array.from({ length: 15 }).map((_, i) => ({
      id: randomUUID(),
      tenantId: tenant1Id,
      name: `Client T1 ${i}`,
      status: ClientStatus.PROSPECT,
      customFieldValues: { favorite_color: 'Blue' },
      lastUpdatedByUserId: userId,
      createdAt: new Date(),
      updatedAt: new Date(),
    }));

    // Seed 1 client for tenant 2 with the SAME custom field
    clients.push({
      id: randomUUID(),
      tenantId: tenant2Id,
      name: `Client T2 1`,
      status: ClientStatus.PROSPECT,
      customFieldValues: { favorite_color: 'Blue' },
      lastUpdatedByUserId: userId,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Save using raw prisma to bypass any repo mapping logic for seeding
    for (const c of clients) {
      await prisma.client.create({ data: c });
    }
  });

  afterAll(async () => {
    await prisma.client.deleteMany({ where: { tenantId: { in: [tenant1Id, tenant2Id] } } });
    await prisma.user.deleteMany({ where: { id: userId } });
    await prisma.tenant.deleteMany({ where: { id: { in: [tenant1Id, tenant2Id] } } });
    await prisma.$disconnect();
  });

  it('proves #2: Pagination total count correctly counts all matches when using custom fields', async () => {
    // Search with skip 0, take 5 for favorite_color = Blue
    const result = await repo.search(tenant1Id, { customFields: { favorite_color: 'Blue' } }, 0, 5);
    
    // Total should be 15, even though we only took 5
    expect(result.items.length).toBe(5);
    expect(result.total).toBe(15);
  });

  it('proves #3: Returns a valid domain entity with properly parsed customFieldValues, Dates, and Enums', async () => {
    const result = await repo.search(tenant1Id, { customFields: { favorite_color: 'Blue' } }, 0, 1);
    
    expect(result.items.length).toBe(1);
    const client = result.items[0];
    
    // Ensure it's an instance of the Client entity
    expect(client).toBeInstanceOf(Client);
    
    // Ensure customFieldValues is a parsed object, not a string
    expect(typeof client.customFieldValues).toBe('object');
    expect(client.customFieldValues.favorite_color).toBe('Blue');

    // Ensure Dates and Enums round-trip properly from raw SQL
    expect(client.createdAt).toBeInstanceOf(Date);
    expect(client.updatedAt).toBeInstanceOf(Date);
    expect(client.status).toBe(ClientStatus.PROSPECT); // Must match enum strictly
  });

  it('proves #2.5: Both typed Prisma and raw-SQL branches produce IDENTICAL mapped Client entities', async () => {
    // 1. Fetch via typed branch (no custom field filter)
    const typedResult = await repo.search(tenant1Id, { name: 'Client T1 0' }, 0, 1);
    // 2. Fetch via raw-SQL branch (with custom field filter)
    const rawResult = await repo.search(tenant1Id, { name: 'Client T1 0', customFields: { favorite_color: 'Blue' } }, 0, 1);

    expect(typedResult.items.length).toBe(1);
    expect(rawResult.items.length).toBe(1);

    // They should be structurally identical since both mapToDomain through Client.reconstitute
    expect(typedResult.items[0]).toEqual(rawResult.items[0]);
  });

  it('proves #4: Cross-tenant isolation exists on the raw-SQL branch', async () => {
    // Try to find the tenant2 client using tenant1's ID but filtering for favorite_color = Blue
    // Even though a Blue client exists in tenant2, it shouldn't be returned for tenant1.
    const resultTenant1 = await repo.search(tenant1Id, { name: 'Client T2 1', customFields: { favorite_color: 'Blue' } }, 0, 10);
    expect(resultTenant1.items.length).toBe(0);
    expect(resultTenant1.total).toBe(0);

    // Prove we can find it if we use tenant2Id
    const resultTenant2 = await repo.search(tenant2Id, { name: 'Client T2 1', customFields: { favorite_color: 'Blue' } }, 0, 10);
    expect(resultTenant2.items.length).toBe(1);
    expect(resultTenant2.total).toBe(1);
  });

  it('proves countByTenant correctly counts only the requested tenant', async () => {
    const count1 = await repo.countByTenant(tenant1Id);
    expect(count1).toBe(15);

    const count2 = await repo.countByTenant(tenant2Id);
    expect(count2).toBe(1);
  });

  it('proves findRecentByTenant strictly isolates to the requested tenant and respects limit', async () => {
    const recentT1 = await repo.findRecentByTenant(tenant1Id, 5);
    expect(recentT1.length).toBe(5);
    recentT1.forEach(c => expect(c.tenantId).toBe(tenant1Id));

    const recentT2 = await repo.findRecentByTenant(tenant2Id, 5);
    expect(recentT2.length).toBe(1);
    expect(recentT2[0].tenantId).toBe(tenant2Id);
  });
});
