import request from 'supertest';
import { createApp } from '../../../src/main/app';
import { PrismaClient } from '@prisma/client';
import { JwtTokenService } from '../../../src/auth/infrastructure/JwtTokenService';
import { v4 as uuidv4 } from 'uuid';

/**
 * What "unused" means, asserted against a real database.
 *
 * This exists because the previous implementation had no notion of unused at
 * all: it ran `ORDER BY last_used_at ASC LIMIT 3` and archived whatever came
 * back, so a tenant whose categories were all in use lost three real ones. The
 * `3` was hard-coded in the controller as "Fixed limit matching UI mock".
 *
 * The agreed definition (TD-027) has two independent parts, and the three
 * seeded categories below exist specifically to pin each one:
 *
 *   EMPTY     — no products at all              -> IS unused
 *   HISTORIC  — no ACTIVE product, but an archived one that was quoted
 *                                               -> is NOT unused
 *   ACTIVE    — has an active product           -> is NOT unused
 *
 * HISTORIC is the case the old query could never have got right, and the one
 * that makes the second condition load-bearing rather than redundant.
 */
describe('Category cleanup — what counts as unused', () => {
  let app: any;
  let prisma: PrismaClient;
  let tokenService: JwtTokenService;

  const slug = 'cleanup-tenant';
  let tenantId: string;
  let ownerToken: string;
  let staffToken: string;

  let emptyCategoryId: string;
  let historicCategoryId: string;
  let activeCategoryId: string;

  /**
   * Every tenant this file creates, so teardown can be scoped to them.
   *
   * Deliberately NOT a bare `deleteMany()` per table. That pattern — see
   * TD-001 — wipes the whole schema regardless of owner, and Jest gives a
   * *worker* its own schema, not a *file*. Any other suite sharing this
   * worker gets its fixtures deleted underneath it. An early version of this
   * file did exactly that and produced an intermittent failure in
   * inventoryE2E.test.ts that did not reproduce when the two were run
   * together, which is precisely how expensive this class of bug is to chase.
   */
  const createdTenantIds: string[] = [];

  const clearCreated = async () => {
    if (createdTenantIds.length === 0) return;
    const where = { tenantId: { in: createdTenantIds } };
    // Ordered by foreign-key dependency, children first.
    await prisma.quotationStatusHistory.deleteMany({ where });
    await prisma.quotationLineItem.deleteMany({ where });
    await prisma.quotation.deleteMany({ where });
    await prisma.stockMovement.deleteMany({ where });
    await prisma.productImage.deleteMany({ where });
    await prisma.stockLevel.deleteMany({ where });
    await prisma.product.deleteMany({ where });
    await prisma.warehouse.deleteMany({ where });
    await prisma.category.deleteMany({ where });
    await prisma.interaction.deleteMany({ where });
    await prisma.appointment.deleteMany({ where });
    await prisma.client.deleteMany({ where });
    await prisma.invitation.deleteMany({ where });
    await prisma.user.deleteMany({ where });
    await prisma.integration.deleteMany({ where });
    await prisma.tenant.deleteMany({ where: { id: { in: createdTenantIds } } });
    createdTenantIds.length = 0;
  };

  beforeEach(async () => {
    await clearCreated();

    tenantId = uuidv4();
    createdTenantIds.push(tenantId);
    await prisma.tenant.create({
      data: { id: tenantId, name: 'Cleanup Tenant', urlSlug: slug },
    });

    const ownerId = uuidv4();
    await prisma.user.create({
      data: { id: ownerId, email: 'owner@cleanup.test', hashedPassword: 'hash', role: 'BUSINESS_OWNER', tenantId },
    });
    const staffId = uuidv4();
    await prisma.user.create({
      data: { id: staffId, email: 'staff@cleanup.test', hashedPassword: 'hash', role: 'STAFF', tenantId },
    });

    ownerToken = tokenService.sign({
      userId: ownerId, role: 'BUSINESS_OWNER' as any, tenantId, tenantSlug: slug, warehouseId: null,
    });
    staffToken = tokenService.sign({
      userId: staffId, role: 'STAFF' as any, tenantId, tenantSlug: slug, warehouseId: null,
    });

    // --- The three categories under test -----------------------------------
    emptyCategoryId = uuidv4();
    historicCategoryId = uuidv4();
    activeCategoryId = uuidv4();
    await prisma.category.createMany({
      data: [
        { id: emptyCategoryId, tenantId, name: 'A Empty', description: 'no products ever' },
        { id: historicCategoryId, tenantId, name: 'B Historic', description: 'archived product, once quoted' },
        { id: activeCategoryId, tenantId, name: 'C Active', description: 'has a live product' },
      ],
    });

    // ACTIVE: one live product. Nothing else needed.
    await prisma.product.create({
      data: {
        id: uuidv4(), tenantId, name: 'Live Widget', description: 'in the catalogue',
        categoryId: activeCategoryId, price: 10, isArchived: false,
      },
    });

    // HISTORIC: the product is archived, so it is not "currently assigned" —
    // but it appears on a quotation, which is what must protect the category.
    const archivedProductId = uuidv4();
    await prisma.product.create({
      data: {
        id: archivedProductId, tenantId, name: 'Retired Widget', description: 'withdrawn',
        categoryId: historicCategoryId, price: 25, isArchived: true,
      },
    });

    const warehouseId = uuidv4();
    await prisma.warehouse.create({ data: { id: warehouseId, tenantId, name: 'Main' } });

    const clientId = uuidv4();
    await prisma.client.create({
      data: {
        id: clientId, tenantId, name: 'Quoting Client', status: 'ACTIVE',
        customFieldValues: {}, lastUpdatedByUserId: ownerId,
      },
    });

    const quotationId = uuidv4();
    await prisma.quotation.create({
      data: { id: quotationId, tenantId, clientId, createdByUserId: ownerId, status: 'ACCEPTED' },
    });
    await prisma.quotationLineItem.create({
      data: {
        id: uuidv4(), tenantId, quotationId, productId: archivedProductId,
        warehouseId, quantity: 2, unitPrice: 25,
      },
    });
  });

  beforeAll(async () => {
    prisma = new PrismaClient();
    await prisma.$connect();
    app = createApp();
    tokenService = new JwtTokenService();
  });

  afterAll(async () => {
    await clearCreated();
    await prisma.$disconnect();
  });

  const preview = () =>
    request(app)
      .get(`/api/${slug}/inventory/categories/cleanup/preview`)
      .set('Authorization', `Bearer ${ownerToken}`);

  const runCleanup = (token = ownerToken) =>
    request(app)
      .post(`/api/${slug}/inventory/categories/cleanup`)
      .set('Authorization', `Bearer ${token}`);

  describe('preview identifies exactly the unused categories', () => {
    it('flags a category with no products and no quotation history', async () => {
      const res = await preview();

      expect(res.status).toBe(200);
      const ids = res.body.categories.map((c: { id: string }) => c.id);
      expect(ids).toContain(emptyCategoryId);
    });

    it('does NOT flag a category whose only product is archived but was quoted', async () => {
      const res = await preview();

      expect(res.status).toBe(200);
      const ids = res.body.categories.map((c: { id: string }) => c.id);
      // The historical reference is the whole point: archiving this category
      // would obscure the lineage of a real, accepted quotation.
      expect(ids).not.toContain(historicCategoryId);
    });

    it('does NOT flag a category with an active product', async () => {
      const res = await preview();

      expect(res.status).toBe(200);
      const ids = res.body.categories.map((c: { id: string }) => c.id);
      expect(ids).not.toContain(activeCategoryId);
    });

    it('returns exactly one candidate for this fixture, not a fixed 3', async () => {
      const res = await preview();

      expect(res.status).toBe(200);
      expect(res.body.count).toBe(1);
      expect(res.body.categories).toHaveLength(1);
      expect(res.body.categories[0]).toEqual({ id: emptyCategoryId, name: 'A Empty' });
    });

    it('changes nothing — preview is read-only', async () => {
      await preview();

      const stillActive = await prisma.category.findMany({
        where: { tenantId, isArchived: true },
      });
      expect(stillActive).toHaveLength(0);
    });
  });

  describe('cleanup archives exactly the previewed set', () => {
    it('archives the unused category and leaves the other two alone', async () => {
      const res = await runCleanup();

      expect(res.status).toBe(200);
      expect(res.body.count).toBe(1);

      const empty = await prisma.category.findUnique({ where: { id: emptyCategoryId } });
      const historic = await prisma.category.findUnique({ where: { id: historicCategoryId } });
      const active = await prisma.category.findUnique({ where: { id: activeCategoryId } });

      expect(empty!.isArchived).toBe(true);
      expect(historic!.isArchived).toBe(false);
      expect(active!.isArchived).toBe(false);
    });

    it('is a no-op on a second run, having nothing left to archive', async () => {
      await runCleanup();
      const second = await runCleanup();

      expect(second.status).toBe(200);
      expect(second.body.count).toBe(0);
    });

    it('archives more than three when more than three are unused', async () => {
      // The old implementation could not have passed this: its LIMIT was 3.
      const extraIds = [1, 2, 3, 4].map(() => uuidv4());
      await prisma.category.createMany({
        data: extraIds.map((id, i) => ({
          id, tenantId, name: `Spare ${i}`, description: 'unused',
        })),
      });

      const res = await runCleanup();

      // 4 spares + the original empty one.
      expect(res.body.count).toBe(5);
      const archived = await prisma.category.findMany({ where: { tenantId, isArchived: true } });
      expect(archived).toHaveLength(5);
    });

    it('refuses a STAFF caller and archives nothing', async () => {
      const res = await runCleanup(staffToken);

      expect(res.status).toBe(403);
      const archived = await prisma.category.findMany({ where: { tenantId, isArchived: true } });
      expect(archived).toHaveLength(0);
    });
  });

  it('does not touch another tenant\'s unused categories', async () => {
    const otherTenantId = uuidv4();
    createdTenantIds.push(otherTenantId);
    await prisma.tenant.create({
      data: { id: otherTenantId, name: 'Other', urlSlug: 'other-cleanup-tenant' },
    });
    const otherCategoryId = uuidv4();
    await prisma.category.create({
      data: { id: otherCategoryId, tenantId: otherTenantId, name: 'Other Empty' },
    });

    const res = await runCleanup();

    expect(res.status).toBe(200);
    const other = await prisma.category.findUnique({ where: { id: otherCategoryId } });
    expect(other!.isArchived).toBe(false);
  });
});
