import { PrismaClient } from '@prisma/client';
import { PrismaClientRepository } from '../../../src/clients/infrastructure/repositories/PrismaClientRepository';
import { ClientStatus } from '../../../src/clients/domain/enums/ClientStatus';
import { randomUUID } from 'crypto';

const prisma = new PrismaClient();

/**
 * Combined client search — SRS §6.2: "Search by name, contact number, or email."
 *
 * `search()` has two independent branches: a raw-SQL one used when custom-field
 * containment is requested, and a Prisma `findMany` one otherwise. Every filter
 * is asserted against BOTH, because a filter implemented in only one branch
 * produces search that silently changes behaviour depending on whether a
 * custom-field filter happens to be active.
 */
describe('Client search filters (name / email / phone)', () => {
  let repo: PrismaClientRepository;

  // Namespaced per run — see TD-001.
  const runId = randomUUID().slice(0, 8);
  const tenant1Id = randomUUID();
  const tenant2Id = randomUUID();
  const userId = randomUUID();

  // Every seeded client carries the same custom field, so the identical query
  // can be run down the raw-SQL branch just by adding `customFields`.
  const MARKER = { batch: runId };

  beforeAll(async () => {
    repo = new PrismaClientRepository(prisma);

    await prisma.tenant.createMany({
      data: [
        { id: tenant1Id, name: 'Search T1', urlSlug: `search-a-${runId}` },
        { id: tenant2Id, name: 'Search T2', urlSlug: `search-b-${runId}` },
      ],
    });

    await prisma.user.create({
      data: { id: userId, email: `search-${runId}@t.com`, hashedPassword: 'p', role: 'BUSINESS_OWNER', tenantId: tenant1Id },
    });

    const base = {
      status: ClientStatus.PROSPECT,
      customFieldValues: MARKER,
      lastUpdatedByUserId: userId,
    };

    await prisma.client.createMany({
      data: [
        { id: randomUUID(), tenantId: tenant1Id, name: 'Alice Anderson', email: 'alice@northwind.com', phone: '555-0100', ...base },
        { id: randomUUID(), tenantId: tenant1Id, name: 'Bob Baker', email: 'bob@southwind.com', phone: '555-0200', ...base },
        // No email or phone at all: proves NULL columns do not break the OR and
        // still match on name.
        { id: randomUUID(), tenantId: tenant1Id, name: 'Carol Contactless', email: null, phone: null, ...base },
        // Tenant 2 holds a client that would match every term below.
        { id: randomUUID(), tenantId: tenant2Id, name: 'Alice Intruder', email: 'alice@northwind.com', phone: '555-0100', ...base },
      ],
    });
  }, 60000);

  afterAll(async () => {
    await prisma.client.deleteMany({ where: { tenantId: { in: [tenant1Id, tenant2Id] } } });
    await prisma.user.deleteMany({ where: { id: userId } });
    await prisma.tenant.deleteMany({ where: { id: { in: [tenant1Id, tenant2Id] } } });
    await prisma.$disconnect();
  });

  /** Runs the same filters down both branches and asserts they agree. */
  const searchBothBranches = async (filters: any) => {
    const prismaBranch = await repo.search(tenant1Id, filters, 0, 50);
    const rawBranch = await repo.search(tenant1Id, { ...filters, customFields: MARKER }, 0, 50);

    const namesOf = (r: { items: any[] }) => r.items.map(c => c.name).sort();
    expect(namesOf(rawBranch)).toEqual(namesOf(prismaBranch));
    expect(rawBranch.total).toBe(prismaBranch.total);

    return namesOf(prismaBranch);
  };

  describe('combined `search` term', () => {
    it('matches on name', async () => {
      expect(await searchBothBranches({ search: 'Anderson' })).toEqual(['Alice Anderson']);
    });

    it('matches on email', async () => {
      expect(await searchBothBranches({ search: 'southwind' })).toEqual(['Bob Baker']);
    });

    it('matches on phone', async () => {
      expect(await searchBothBranches({ search: '555-0200' })).toEqual(['Bob Baker']);
    });

    it('is case-insensitive, like the existing name search', async () => {
      expect(await searchBothBranches({ search: 'ALICE@NORTHWIND' })).toEqual(['Alice Anderson']);
    });

    it('matches partially, like the existing name search', async () => {
      expect(await searchBothBranches({ search: 'wind.com' }).then(n => n.sort()))
        .toEqual(['Alice Anderson', 'Bob Baker']);
    });

    it('still matches a client with NULL email and phone via their name', async () => {
      expect(await searchBothBranches({ search: 'Contactless' })).toEqual(['Carol Contactless']);
    });

    it('returns nothing for a term that matches no field', async () => {
      expect(await searchBothBranches({ search: 'zzz-no-such-client' })).toEqual([]);
    });

    it('never crosses tenants, even when another tenant matches exactly', async () => {
      const names = await searchBothBranches({ search: 'alice@northwind.com' });
      expect(names).toEqual(['Alice Anderson']);
      expect(names).not.toContain('Alice Intruder');
    });
  });

  describe('field-specific filters', () => {
    it('filters by email alone', async () => {
      expect(await searchBothBranches({ email: 'northwind' })).toEqual(['Alice Anderson']);
    });

    it('filters by phone alone', async () => {
      expect(await searchBothBranches({ phone: '0100' })).toEqual(['Alice Anderson']);
    });

    it('still filters by name alone, unchanged', async () => {
      expect(await searchBothBranches({ name: 'Baker' })).toEqual(['Bob Baker']);
    });

    it('combines a field filter with the search term (AND, not OR)', async () => {
      // 'wind.com' alone matches Alice and Bob; adding name narrows to one.
      expect(await searchBothBranches({ search: 'wind.com', name: 'Bob' })).toEqual(['Bob Baker']);
    });
  });

  it('returns every tenant client when no filters are supplied', async () => {
    expect(await searchBothBranches({})).toEqual(['Alice Anderson', 'Bob Baker', 'Carol Contactless']);
  });
});
