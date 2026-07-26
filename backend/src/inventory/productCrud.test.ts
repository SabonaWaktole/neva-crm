import fs from 'fs';
import path from 'path';
import request from 'supertest';
import sharp from 'sharp';
import { prisma } from '../shared/infrastructure/prisma/client';
import { createApp } from '../main/app';
import { JwtTokenService } from '../auth/infrastructure/JwtTokenService';
import { UserRole } from '../auth/domain/enums/UserRole';
import { UPLOADS_DIR } from '../media/MediaService';

/**
 * End-to-end coverage for the product catalogue: every field round-trips, the
 * list controls actually filter/sort/page, images upload and reorder as real
 * files, and delete cleans up after itself.
 */
describe('Product CRUD, list controls and images', () => {
  let app: any;
  const tokenService = new JwtTokenService();

  const tenantId = 't_prod_crud';
  const ownerId = 'u_owner_prod_crud';
  const staffId = 'u_staff_prod_crud';

  let ownerToken: string;
  let staffToken: string;
  let warehouseId: string;
  let categoryId: string;

  const base = `/api/prod-crud/inventory`;
  const auth = (token: string) => ({ Authorization: `Bearer ${token}` });

  /** A real, decodable PNG — sharp rejects anything that only claims to be one. */
  const pixel = (colour: { r: number; g: number; b: number }) =>
    sharp({
      create: { width: 24, height: 24, channels: 3, background: colour },
    })
      .png()
      .toBuffer();

  beforeAll(() => {
    app = createApp();
  });

  /**
   * Fixtures are rebuilt (idempotently) before every test rather than once.
   *
   * Several other integration suites in this repo clean up with unscoped
   * `deleteMany()` calls, which wipe this tenant out from under a long-lived
   * `beforeAll`. Upserting per test makes the suite independent of whatever
   * else is running against the same database.
   */
  beforeEach(async () => {
    await prisma.tenant.upsert({
      where: { id: tenantId },
      update: {},
      create: { id: tenantId, name: 'Prod CRUD', urlSlug: 'prod-crud' },
    });

    for (const [id, email, role] of [
      [ownerId, 'owner@prodcrud.test', UserRole.BUSINESS_OWNER],
      [staffId, 'staff@prodcrud.test', UserRole.STAFF],
    ] as const) {
      await prisma.user.upsert({
        where: { id },
        update: { tenantId },
        create: { id, tenantId, email, hashedPassword: 'h', role },
      });
    }

    ownerToken = tokenService.sign({
      userId: ownerId, role: UserRole.BUSINESS_OWNER, tenantId,
      tenantSlug: 'prod-crud', warehouseId: null,
    });

    const warehouse = await prisma.warehouse.upsert({
      where: { tenantId_name: { tenantId, name: 'Main Hub' } },
      update: {},
      create: { id: 'w_prod_crud', tenantId, name: 'Main Hub' },
    });
    warehouseId = warehouse.id;

    const category = await prisma.category.upsert({
      where: { tenantId_name: { tenantId, name: 'Seating' } },
      update: {},
      create: { id: 'cat_prod_crud', tenantId, name: 'Seating' },
    });
    categoryId = category.id;

    staffToken = tokenService.sign({
      userId: staffId, role: UserRole.STAFF, tenantId,
      tenantSlug: 'prod-crud', warehouseId,
    });
  });

  afterAll(async () => {
    await prisma.productImage.deleteMany({ where: { tenantId } });
    await prisma.stockMovement.deleteMany({ where: { tenantId } });
    await prisma.stockLevel.deleteMany({ where: { tenantId } });
    await prisma.product.deleteMany({ where: { tenantId } });
    await prisma.warehouse.deleteMany({ where: { tenantId } });
    await prisma.category.deleteMany({ where: { tenantId } });
    await prisma.user.deleteMany({ where: { tenantId } });
    await prisma.tenant.deleteMany({ where: { id: tenantId } });
    await prisma.$disconnect();
  });

  afterEach(async () => {
    await prisma.productImage.deleteMany({ where: { tenantId } });
    await prisma.stockMovement.deleteMany({ where: { tenantId } });
    await prisma.stockLevel.deleteMany({ where: { tenantId } });
    await prisma.product.deleteMany({ where: { tenantId } });
  });

  const createProduct = (overrides: Record<string, unknown> = {}) =>
    request(app)
      .post(`${base}/products`)
      .set(auth(ownerToken))
      .send({
        name: 'Ergonomic Chair',
        description: 'A very good chair',
        sku: 'CHR-001',
        brand: 'Aeron',
        categoryId,
        price: 499.99,
        cost: 220,
        tags: ['office', 'seating'],
        lowStockThreshold: 5,
        initialStock: [{ warehouseId, quantity: 12 }],
        ...overrides,
      });

  // ======================
  // CREATE / READ / UPDATE
  // ======================

  it('round-trips every catalogue field on create and read', async () => {
    const created = await createProduct();
    expect(created.status).toBe(201);

    expect(created.body).toMatchObject({
      name: 'Ergonomic Chair',
      sku: 'CHR-001',
      brand: 'Aeron',
      categoryId,
      categoryName: 'Seating',
      price: 499.99,
      cost: 220,
      tags: ['office', 'seating'],
      lowStockThreshold: 5,
      isArchived: false,
      totalUnits: 12,
      status: 'IN_STOCK',
    });

    const fetched = await request(app)
      .get(`${base}/products/${created.body.id}`)
      .set(auth(ownerToken));

    expect(fetched.status).toBe(200);
    expect(fetched.body).toEqual(created.body);
  });

  it('updates every editable field', async () => {
    const { body: product } = await createProduct();

    const updated = await request(app)
      .put(`${base}/products/${product.id}`)
      .set(auth(ownerToken))
      .send({
        name: 'Ergonomic Chair v2',
        description: 'Now with lumbar support',
        sku: 'CHR-002',
        brand: 'Embody',
        categoryId: null,
        price: 599,
        cost: 250,
        tags: ['premium'],
        lowStockThreshold: 20,
      });

    expect(updated.status).toBe(200);
    expect(updated.body).toMatchObject({
      name: 'Ergonomic Chair v2',
      sku: 'CHR-002',
      brand: 'Embody',
      categoryId: null,
      categoryName: null,
      price: 599,
      cost: 250,
      tags: ['premium'],
      lowStockThreshold: 20,
      // 12 units against a threshold of 20 is now Low Stock.
      status: 'LOW_STOCK',
    });
  });

  it('clears optional fields when they are sent as null', async () => {
    const { body: product } = await createProduct();

    const updated = await request(app)
      .put(`${base}/products/${product.id}`)
      .set(auth(ownerToken))
      .send({ sku: null, brand: null, cost: null, tags: [] });

    expect(updated.body.sku).toBeNull();
    expect(updated.body.brand).toBeNull();
    expect(updated.body.cost).toBeNull();
    expect(updated.body.tags).toEqual([]);
  });

  it('rejects a duplicate SKU with 409 rather than a database error', async () => {
    await createProduct();
    const clash = await createProduct({ name: 'Another Chair' });

    expect(clash.status).toBe(409);
    expect(clash.body.error).toContain('CHR-001');
  });

  it('rejects an invalid payload with a readable message', async () => {
    const bad = await createProduct({ price: -5 });
    expect(bad.status).toBe(400);
    expect(bad.body.error).toContain('negative');
  });

  // ======================
  // LIST CONTROLS
  // ======================

  const seedThree = async () => {
    await createProduct({ name: 'Alpha', sku: 'A-1', price: 10, tags: ['office'], initialStock: [] });
    await createProduct({
      name: 'Bravo', sku: 'B-1', price: 30, tags: ['office', 'sale'],
      lowStockThreshold: 5, initialStock: [{ warehouseId, quantity: 3 }],
    });
    await createProduct({
      name: 'Charlie', sku: 'C-1', price: 20, tags: ['sale'],
      lowStockThreshold: 5, initialStock: [{ warehouseId, quantity: 50 }],
    });
  };

  it('searches across name, SKU and brand', async () => {
    await seedThree();

    const byName = await request(app).get(`${base}/products?name=brav`).set(auth(ownerToken));
    expect(byName.body.items.map((p: any) => p.name)).toEqual(['Bravo']);

    const bySku = await request(app).get(`${base}/products?name=C-1`).set(auth(ownerToken));
    expect(bySku.body.items.map((p: any) => p.name)).toEqual(['Charlie']);

    const byBrand = await request(app).get(`${base}/products?name=aeron`).set(auth(ownerToken));
    expect(byBrand.body.items).toHaveLength(3);
  });

  it('filters by status, category and tags', async () => {
    await seedThree();

    const low = await request(app).get(`${base}/products?status=LOW_STOCK`).set(auth(ownerToken));
    expect(low.body.items.map((p: any) => p.name)).toEqual(['Bravo']);

    const out = await request(app).get(`${base}/products?status=OUT_OF_STOCK`).set(auth(ownerToken));
    expect(out.body.items.map((p: any) => p.name)).toEqual(['Alpha']);

    const byCategory = await request(app)
      .get(`${base}/products?categoryId=${categoryId}`)
      .set(auth(ownerToken));
    expect(byCategory.body.items).toHaveLength(3);

    // `tags` is an AND across the list, not an OR.
    const bothTags = await request(app)
      .get(`${base}/products?tags=office,sale`)
      .set(auth(ownerToken));
    expect(bothTags.body.items.map((p: any) => p.name)).toEqual(['Bravo']);
  });

  it('sorts by price and by stock in both directions', async () => {
    await seedThree();

    const priceDesc = await request(app)
      .get(`${base}/products?sortBy=price&sortDirection=desc`)
      .set(auth(ownerToken));
    expect(priceDesc.body.items.map((p: any) => p.name)).toEqual(['Bravo', 'Charlie', 'Alpha']);

    const stockAsc = await request(app)
      .get(`${base}/products?sortBy=stock&sortDirection=asc`)
      .set(auth(ownerToken));
    expect(stockAsc.body.items.map((p: any) => p.name)).toEqual(['Alpha', 'Bravo', 'Charlie']);
  });

  it('paginates and reports the unpaginated total', async () => {
    await seedThree();

    const firstPage = await request(app)
      .get(`${base}/products?pageSize=2&page=1`)
      .set(auth(ownerToken));
    expect(firstPage.body.items).toHaveLength(2);
    expect(firstPage.body.total).toBe(3);

    const secondPage = await request(app)
      .get(`${base}/products?pageSize=2&page=2`)
      .set(auth(ownerToken));
    expect(secondPage.body.items).toHaveLength(1);
    expect(secondPage.body.page).toBe(2);

    // A page past the end clamps rather than returning an unreachable empty list.
    const beyond = await request(app)
      .get(`${base}/products?pageSize=2&page=9`)
      .set(auth(ownerToken));
    expect(beyond.body.page).toBe(2);
    expect(beyond.body.items).toHaveLength(1);
  });

  it('summarises the whole filtered set, not just the page', async () => {
    await seedThree();

    const res = await request(app)
      .get(`${base}/products?pageSize=1`)
      .set(auth(ownerToken));

    expect(res.body.items).toHaveLength(1);
    expect(res.body.summary).toMatchObject({
      totalProducts: 3,
      outOfStock: 1,
      lowStock: 1,
      archived: 0,
      totalUnits: 53,
    });
    // 3 x 30 + 50 x 20
    expect(res.body.summary.inventoryValue).toBe(1090);
  });

  it('exposes the brands and tags in use as filter facets', async () => {
    await seedThree();

    const res = await request(app).get(`${base}/products/facets`).set(auth(ownerToken));
    expect(res.body.brands).toEqual(['Aeron']);
    expect(res.body.tags).toEqual(['office', 'sale']);
  });

  // ======================
  // ARCHIVE / DELETE / BULK
  // ======================

  it('hides archived products by default and finds them on request', async () => {
    const { body: product } = await createProduct();
    await request(app)
      .put(`${base}/products/${product.id}`)
      .set(auth(ownerToken))
      .send({ isArchived: true });

    const defaultList = await request(app).get(`${base}/products`).set(auth(ownerToken));
    expect(defaultList.body.items).toHaveLength(0);

    const archived = await request(app)
      .get(`${base}/products?status=ARCHIVED`)
      .set(auth(ownerToken));
    expect(archived.body.items).toHaveLength(1);
    // ARCHIVED outranks availability even though 12 units are on hand.
    expect(archived.body.items[0].status).toBe('ARCHIVED');
    expect(archived.body.summary.archived).toBe(1);
  });

  it('deletes a product with its stock, movements and images', async () => {
    const { body: product } = await createProduct();
    await request(app)
      .post(`${base}/products/${product.id}/adjust`)
      .set(auth(ownerToken))
      .send({ warehouseId, quantityChange: 5 });

    const removed = await request(app)
      .delete(`${base}/products/${product.id}`)
      .set(auth(ownerToken));
    expect(removed.status).toBe(204);

    expect(await prisma.product.count({ where: { tenantId } })).toBe(0);
    expect(await prisma.stockLevel.count({ where: { tenantId } })).toBe(0);
    expect(await prisma.stockMovement.count({ where: { tenantId } })).toBe(0);
  });

  it('refuses to delete a product a quotation references', async () => {
    const { body: product } = await createProduct();

    const client = await prisma.client.create({
      data: {
        id: 'c_prod_crud',
        tenantId,
        name: 'Acme',
        status: 'ACTIVE',
        customFieldValues: {},
        lastUpdatedByUserId: ownerId,
      },
    });
    const quotation = await prisma.quotation.create({
      data: { tenantId, clientId: client.id, createdByUserId: ownerId, status: 'Draft' },
    });
    await prisma.quotationLineItem.create({
      data: {
        tenantId, quotationId: quotation.id, productId: product.id,
        warehouseId, quantity: 1, unitPrice: 499.99,
      },
    });

    const blocked = await request(app)
      .delete(`${base}/products/${product.id}`)
      .set(auth(ownerToken));

    expect(blocked.status).toBe(409);
    expect(blocked.body.error).toContain('Archive it instead');

    await prisma.quotationLineItem.deleteMany({ where: { tenantId } });
    await prisma.quotation.deleteMany({ where: { tenantId } });
    await prisma.client.deleteMany({ where: { tenantId } });
  });

  it('applies bulk archive and reports per-product failures on bulk delete', async () => {
    await seedThree();
    const all = await request(app).get(`${base}/products`).set(auth(ownerToken));
    const ids = all.body.items.map((p: any) => p.id);

    const archived = await request(app)
      .post(`${base}/products/bulk`)
      .set(auth(ownerToken))
      .send({ ids, action: 'archive' });

    expect(archived.status).toBe(200);
    expect(archived.body.succeeded).toHaveLength(3);
    expect(await prisma.product.count({ where: { tenantId, isArchived: true } })).toBe(3);

    const deleted = await request(app)
      .post(`${base}/products/bulk`)
      .set(auth(ownerToken))
      .send({ ids: [...ids, 'does-not-exist'], action: 'delete' });

    expect(deleted.body.succeeded).toHaveLength(3);
    expect(deleted.body.failed).toHaveLength(1);
    expect(deleted.body.failed[0].id).toBe('does-not-exist');
  });

  it('keeps bulk actions and deletion away from staff', async () => {
    const { body: product } = await createProduct();

    const staffDelete = await request(app)
      .delete(`${base}/products/${product.id}`)
      .set(auth(staffToken));
    expect(staffDelete.status).toBe(403);

    const staffBulk = await request(app)
      .post(`${base}/products/bulk`)
      .set(auth(staffToken))
      .send({ ids: [product.id], action: 'archive' });
    expect(staffBulk.status).toBe(403);
  });

  // ======================
  // IMAGES
  // ======================

  it('uploads, reorders and removes product images, cleaning up the files', async () => {
    const { body: product } = await createProduct();

    const uploaded = await request(app)
      .post(`${base}/products/${product.id}/images`)
      .set(auth(ownerToken))
      .attach('files', await pixel({ r: 255, g: 0, b: 0 }), 'red.png')
      .attach('files', await pixel({ r: 0, g: 0, b: 255 }), 'blue.png');

    expect(uploaded.status).toBe(201);
    expect(uploaded.body).toHaveLength(2);
    expect(uploaded.body.map((i: any) => i.position)).toEqual([0, 1]);
    // Everything is re-encoded to WebP regardless of what was sent.
    expect(uploaded.body[0].url).toMatch(/\/uploads\/.+@1x\.webp$/);
    expect(uploaded.body[0].srcSet).toContain('@2x.webp 2x');

    const [first, second] = uploaded.body;
    const onDisk = path.join(UPLOADS_DIR, tenantId, path.basename(first.url));
    expect(fs.existsSync(onDisk)).toBe(true);

    // Dragging the second image to the front.
    const reordered = await request(app)
      .put(`${base}/products/${product.id}/images/order`)
      .set(auth(ownerToken))
      .send({ imageIds: [second.id, first.id] });

    expect(reordered.status).toBe(200);
    expect(reordered.body.map((i: any) => i.id)).toEqual([second.id, first.id]);
    expect(reordered.body.map((i: any) => i.position)).toEqual([0, 1]);

    // A partial ordering is refused rather than silently leaving gaps.
    const partial = await request(app)
      .put(`${base}/products/${product.id}/images/order`)
      .set(auth(ownerToken))
      .send({ imageIds: [second.id] });
    expect(partial.status).toBe(400);

    const afterDelete = await request(app)
      .delete(`${base}/products/${product.id}/images/${second.id}`)
      .set(auth(ownerToken));

    expect(afterDelete.status).toBe(200);
    expect(afterDelete.body).toHaveLength(1);
    // Positions close up so index 0 is still the primary image.
    expect(afterDelete.body[0]).toMatchObject({ id: first.id, position: 0 });

    const deletedFile = path.join(UPLOADS_DIR, tenantId, path.basename(second.url));
    expect(fs.existsSync(deletedFile)).toBe(false);

    // Deleting the product takes the remaining file with it.
    await request(app).delete(`${base}/products/${product.id}`).set(auth(ownerToken));
    expect(fs.existsSync(onDisk)).toBe(false);
  });

  it('surfaces images on the list so the table can show a thumbnail', async () => {
    const { body: product } = await createProduct();
    await request(app)
      .post(`${base}/products/${product.id}/images`)
      .set(auth(ownerToken))
      .attach('files', await pixel({ r: 0, g: 255, b: 0 }), 'green.png');

    const list = await request(app).get(`${base}/products`).set(auth(ownerToken));
    expect(list.body.items[0].images).toHaveLength(1);
    expect(list.body.items[0].images[0].position).toBe(0);

    await request(app).delete(`${base}/products/${product.id}`).set(auth(ownerToken));
  });

  it('refuses a file that is not an accepted image type', async () => {
    const { body: product } = await createProduct();

    const rejected = await request(app)
      .post(`${base}/products/${product.id}/images`)
      .set(auth(ownerToken))
      .attach('files', Buffer.from('not an image'), {
        filename: 'notes.txt',
        contentType: 'text/plain',
      });

    expect(rejected.status).toBe(415);
    expect(await prisma.productImage.count({ where: { tenantId } })).toBe(0);
  });

  it('will not let one tenant read another tenant\'s product', async () => {
    const { body: product } = await createProduct();

    const otherTenantId = 't_prod_crud_other';
    await prisma.tenant.create({
      data: { id: otherTenantId, name: 'Other', urlSlug: 'prod-crud-other' },
    });
    const otherOwner = await prisma.user.create({
      data: {
        id: 'u_other_prod_crud', tenantId: otherTenantId,
        email: 'other@prodcrud.test', hashedPassword: 'h', role: UserRole.BUSINESS_OWNER,
      },
    });
    const otherToken = tokenService.sign({
      userId: otherOwner.id, role: UserRole.BUSINESS_OWNER, tenantId: otherTenantId,
      tenantSlug: 'prod-crud-other', warehouseId: null,
    });

    const leaked = await request(app)
      .get(`/api/prod-crud-other/inventory/products/${product.id}`)
      .set(auth(otherToken));
    expect(leaked.status).toBe(404);

    await prisma.user.deleteMany({ where: { tenantId: otherTenantId } });
    await prisma.tenant.deleteMany({ where: { id: otherTenantId } });
  });
});
