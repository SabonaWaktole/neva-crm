import { PrismaClient } from '@prisma/client';
import { PrismaInteractionRepository } from '../../../src/clients/infrastructure/repositories/PrismaInteractionRepository';
import { Interaction } from '../../../src/clients/domain/entities/Interaction';
import { ClientStatus } from '../../../src/clients/domain/enums/ClientStatus';
import { randomUUID } from 'crypto';

const prisma = new PrismaClient();

describe('PrismaInteractionRepository Integration', () => {
  let repo: PrismaInteractionRepository;
  
  const tenant1Id = 't-interact-1';
  const tenant2Id = 't-interact-2';
  
  const user1Id = 'u-interact-1';
  const user2Id = 'u-interact-2';
  
  const client1Id = 'c-interact-1';
  const client2Id = 'c-interact-2';

  beforeAll(async () => {
    repo = new PrismaInteractionRepository(prisma);

    // Setup base dependencies
    await prisma.tenant.createMany({
      data: [
        { id: tenant1Id, name: 'Tenant 1', urlSlug: 't-interact-1' },
        { id: tenant2Id, name: 'Tenant 2', urlSlug: 't-interact-2' },
      ],
      skipDuplicates: true,
    });

    await prisma.user.createMany({
      data: [
        { id: user1Id, email: 'u1-interact@example.com', hashedPassword: 'pwd', role: 'BUSINESS_OWNER', tenantId: tenant1Id },
        { id: user2Id, email: 'u2-interact@example.com', hashedPassword: 'pwd', role: 'BUSINESS_OWNER', tenantId: tenant2Id },
      ],
      skipDuplicates: true,
    });

    // Clean up existing interactions and clients for these tenants
    await prisma.interaction.deleteMany({ where: { tenantId: { in: [tenant1Id, tenant2Id] } } });
    await prisma.client.deleteMany({ where: { tenantId: { in: [tenant1Id, tenant2Id] } } });

    await prisma.client.createMany({
      data: [
        {
          id: client1Id,
          tenantId: tenant1Id,
          name: 'Client 1',
          status: ClientStatus.ACTIVE,
          customFieldValues: {},
          lastUpdatedByUserId: user1Id,
        },
        {
          id: client2Id,
          tenantId: tenant2Id,
          name: 'Client 2',
          status: ClientStatus.ACTIVE,
          customFieldValues: {},
          lastUpdatedByUserId: user2Id,
        },
      ],
      skipDuplicates: true,
    });

    // Seed 5 interactions for Tenant 1
    const now = new Date().getTime();
    const t1Interactions = Array.from({ length: 5 }).map((_, i) => ({
      id: randomUUID(),
      tenantId: tenant1Id,
      clientId: client1Id,
      authorUserId: user1Id,
      content: `Tenant 1 Interaction ${i}`,
      channel: 'NOTE',
      // i=0 is newest, i=4 is oldest
      createdAt: new Date(now - i * 1000),
    }));

    // Seed 2 interactions for Tenant 2
    const t2Interactions = Array.from({ length: 2 }).map((_, i) => ({
      id: randomUUID(),
      tenantId: tenant2Id,
      clientId: client2Id,
      authorUserId: user2Id,
      content: `Tenant 2 Interaction ${i}`,
      channel: 'NOTE',
      createdAt: new Date(now - i * 1000),
    }));

    await prisma.interaction.createMany({
      data: [...t1Interactions, ...t2Interactions],
    });
  });

  afterAll(async () => {
    await prisma.interaction.deleteMany({ where: { tenantId: { in: [tenant1Id, tenant2Id] } } });
    await prisma.client.deleteMany({ where: { tenantId: { in: [tenant1Id, tenant2Id] } } });
    await prisma.notification.deleteMany({ where: { tenantId: { in: [tenant1Id, tenant2Id] } } });
    await prisma.user.deleteMany({ where: { tenantId: { in: [tenant1Id, tenant2Id] } } });
    await prisma.tenant.deleteMany({ where: { id: { in: [tenant1Id, tenant2Id] } } });
    await prisma.$disconnect();
  });

  it('correctly returns only Tenant 1 interactions, ordered by createdAt descending', async () => {
    const results = await repo.findRecentByTenant(tenant1Id, 10);
    
    expect(results.length).toBe(5);
    
    results.forEach((interaction) => {
      expect(interaction.tenantId).toBe(tenant1Id);
      expect(interaction).toBeInstanceOf(Interaction);
    });

    for (let i = 0; i < results.length - 1; i++) {
      expect(results[i].createdAt.getTime()).toBeGreaterThanOrEqual(results[i + 1].createdAt.getTime());
    }
  });

  it('respects the limit parameter', async () => {
    const limit = 3;
    const results = await repo.findRecentByTenant(tenant1Id, limit);
    
    expect(results.length).toBe(limit);
    
    for (let i = 0; i < results.length - 1; i++) {
      expect(results[i].createdAt.getTime()).toBeGreaterThanOrEqual(results[i + 1].createdAt.getTime());
    }
  });

  it('correctly scopes results when authorUserId is provided', async () => {
    const otherUserId = 'u-interact-1-other';
    await prisma.user.create({
      data: { id: otherUserId, email: 'u1-other@example.com', hashedPassword: 'pwd', role: 'STAFF', tenantId: tenant1Id },
    });
    
    const otherUserInteractionId = randomUUID();
    await prisma.interaction.create({
      data: {
        id: otherUserInteractionId,
        tenantId: tenant1Id,
        clientId: client1Id,
        authorUserId: otherUserId,
        content: `Tenant 1 Interaction by Other User`,
        channel: 'NOTE',
        createdAt: new Date(),
      }
    });

    try {
      const allT1 = await repo.findRecentByTenant(tenant1Id, 10);
      expect(allT1.length).toBe(6);

      const scopedUser1 = await repo.findRecentByTenant(tenant1Id, 10, user1Id);
      expect(scopedUser1.length).toBe(5);
      scopedUser1.forEach((interaction) => {
        expect(interaction.authorUserId).toBe(user1Id);
      });

      const scopedOther = await repo.findRecentByTenant(tenant1Id, 10, otherUserId);
      expect(scopedOther.length).toBe(1);
      expect(scopedOther[0].authorUserId).toBe(otherUserId);
    } finally {
      await prisma.interaction.delete({ where: { id: otherUserInteractionId } });
      await prisma.user.delete({ where: { id: otherUserId } });
    }
  });
});
