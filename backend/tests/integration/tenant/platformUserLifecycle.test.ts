import request from 'supertest';
import { createApp } from '../../../src/main/app';
import { PrismaClient } from '@prisma/client';
import { JwtTokenService } from '../../../src/auth/infrastructure/JwtTokenService';
import { v4 as uuidv4 } from 'uuid';
import { UserRole } from '../../../src/auth/domain/enums/UserRole';

/**
 * End-to-end coverage of the Platform Admin user-lifecycle routes mounted at
 * /api/tenants/users/:id/{suspend,reactivate} and DELETE /api/tenants/users/:id
 * — the full matrix `PlatformSuspendUserUseCase`/`PlatformReactivateUserUseCase`/
 * `PlatformDeleteUserUseCase`'s unit tests exercise in isolation, here run
 * against the real database and router wiring.
 */
describe('Platform Admin user lifecycle', () => {
  let app: any;
  let prisma: PrismaClient;
  let tokenService: JwtTokenService;
  let superAdminToken: string;

  let tenantId: string;
  let slug: string;
  let createdUserIds: string[] = [];

  const tokenFor = (userId: string, role: UserRole) =>
    tokenService.sign({ userId, tenantId: null, tenantSlug: null, role, warehouseId: null });

  const createUser = async (role: 'BUSINESS_OWNER' | 'STAFF' | 'SUPER_ADMIN', over: Partial<{ tenantId: string | null; isActive: boolean; email: string }> = {}) => {
    const id = uuidv4();
    const user = await prisma.user.create({
      data: {
        id,
        tenantId: over.tenantId === undefined ? tenantId : over.tenantId,
        email: over.email ?? `${role.toLowerCase()}-${id.slice(0, 8)}@test.com`,
        hashedPassword: 'hash',
        role,
        isActive: over.isActive ?? true,
      },
    });
    createdUserIds.push(id);
    return user;
  };

  beforeAll(async () => {
    prisma = new PrismaClient();
    await prisma.$connect();
    app = createApp();
    tokenService = new JwtTokenService();
  }, 60000);

  afterAll(async () => {
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    tenantId = uuidv4();
    slug = `lifecycle-${tenantId.slice(0, 8)}`;
    await prisma.tenant.create({ data: { id: tenantId, name: 'Lifecycle Co', urlSlug: slug } });

    const superAdmin = await prisma.user.create({
      data: { id: uuidv4(), tenantId: null, email: `super-${slug}@platform.com`, hashedPassword: 'hash', role: 'SUPER_ADMIN' },
    });
    createdUserIds = [superAdmin.id];
    superAdminToken = tokenFor(superAdmin.id, 'SUPER_ADMIN');
  });

  afterEach(async () => {
    await prisma.ownershipTransfer.deleteMany({ where: { tenantId } });
    await prisma.auditLog.deleteMany({ where: { OR: [{ tenantId }, { targetId: { in: createdUserIds } }] } });
    await prisma.user.deleteMany({ where: { id: { in: createdUserIds } } });
    await prisma.tenant.deleteMany({ where: { id: tenantId } });
    createdUserIds = [];
  });

  describe('suspend', () => {
    it('suspends a STAFF member directly', async () => {
      const staff = await createUser('STAFF');

      const res = await request(app)
        .patch(`/api/tenants/users/${staff.id}/suspend`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({});

      expect(res.status).toBe(200);
      expect(res.body.user.isActive).toBe(false);
    });

    it('rejects a non-SUPER_ADMIN caller with 403', async () => {
      const staff = await createUser('STAFF');
      const owner = await createUser('BUSINESS_OWNER');

      const res = await request(app)
        .patch(`/api/tenants/users/${staff.id}/suspend`)
        .set('Authorization', `Bearer ${tokenFor(owner.id, 'BUSINESS_OWNER')}`)
        .send({});

      expect(res.status).toBe(403);
    });

    it('suspends a sole Business Owner directly, with no staff to transfer to', async () => {
      const owner = await createUser('BUSINESS_OWNER');

      const res = await request(app)
        .patch(`/api/tenants/users/${owner.id}/suspend`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({});

      expect(res.status).toBe(200);
      expect(res.body.user.isActive).toBe(false);
      expect(res.body.user.role).toBe('BUSINESS_OWNER');
    });

    it('requires newOwnerId (409) when the Business Owner has active staff, then transfers ownership', async () => {
      const owner = await createUser('BUSINESS_OWNER');
      const staff = await createUser('STAFF');

      const withoutOwner = await request(app)
        .patch(`/api/tenants/users/${owner.id}/suspend`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({});
      expect(withoutOwner.status).toBe(409);
      expect(withoutOwner.body.code).toBe('OWNERSHIP_TRANSFER_REQUIRED');

      const res = await request(app)
        .patch(`/api/tenants/users/${owner.id}/suspend`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({ newOwnerId: staff.id });

      expect(res.status).toBe(200);
      expect(res.body.user.isActive).toBe(false);

      const promotedStaff = await prisma.user.findUnique({ where: { id: staff.id } });
      expect(promotedStaff?.role).toBe('BUSINESS_OWNER');

      const transfer = await prisma.ownershipTransfer.findFirst({ where: { originalOwnerId: owner.id } });
      expect(transfer?.status).toBe('ACTIVE');
      expect(transfer?.actingOwnerId).toBe(staff.id);
    });

    it('returns 400 for a newOwnerId that is not an eligible staff member', async () => {
      const owner = await createUser('BUSINESS_OWNER');
      await createUser('STAFF');
      const outsider = await createUser('STAFF', { tenantId: null, email: `outsider-${slug}@test.com` });

      const res = await request(app)
        .patch(`/api/tenants/users/${owner.id}/suspend`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({ newOwnerId: outsider.id });

      expect(res.status).toBe(400);
    });
  });

  describe('reactivate', () => {
    it('reactivates a plain suspension with a single PATCH', async () => {
      const staff = await createUser('STAFF', { isActive: false });

      const res = await request(app)
        .patch(`/api/tenants/users/${staff.id}/reactivate`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({});

      expect(res.status).toBe(200);
      expect(res.body.user.isActive).toBe(true);
    });

    it('requires restoreOwnership (409) after a suspension that transferred ownership, then restores it', async () => {
      const owner = await createUser('BUSINESS_OWNER');
      const staff = await createUser('STAFF');

      await request(app)
        .patch(`/api/tenants/users/${owner.id}/suspend`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({ newOwnerId: staff.id });

      const withoutChoice = await request(app)
        .patch(`/api/tenants/users/${owner.id}/reactivate`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({});
      expect(withoutChoice.status).toBe(409);
      expect(withoutChoice.body.code).toBe('RESTORE_CHOICE_REQUIRED');

      const res = await request(app)
        .patch(`/api/tenants/users/${owner.id}/reactivate`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({ restoreOwnership: true });

      expect(res.status).toBe(200);
      expect(res.body.user.isActive).toBe(true);
      expect(res.body.user.role).toBe('BUSINESS_OWNER');

      const revertedStaff = await prisma.user.findUnique({ where: { id: staff.id } });
      expect(revertedStaff?.role).toBe('STAFF');

      const transfer = await prisma.ownershipTransfer.findFirst({ where: { originalOwnerId: owner.id } });
      expect(transfer?.status).toBe('RESTORED');
    });

    it('keeps the acting owner and returns the original owner as STAFF when chosen', async () => {
      const owner = await createUser('BUSINESS_OWNER');
      const staff = await createUser('STAFF');

      await request(app)
        .patch(`/api/tenants/users/${owner.id}/suspend`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({ newOwnerId: staff.id });

      const res = await request(app)
        .patch(`/api/tenants/users/${owner.id}/reactivate`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({ restoreOwnership: false });

      expect(res.status).toBe(200);
      expect(res.body.user.role).toBe('STAFF');

      const actingOwner = await prisma.user.findUnique({ where: { id: staff.id } });
      expect(actingOwner?.role).toBe('BUSINESS_OWNER');

      const transfer = await prisma.ownershipTransfer.findFirst({ where: { originalOwnerId: owner.id } });
      expect(transfer?.status).toBe('KEPT');
    });
  });

  describe('delete', () => {
    it('requires the exact confirmEmail (400 on mismatch)', async () => {
      const staff = await createUser('STAFF');

      const res = await request(app)
        .delete(`/api/tenants/users/${staff.id}`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({ confirmEmail: 'wrong@example.com' });

      expect(res.status).toBe(400);

      const stillThere = await prisma.user.findUnique({ where: { id: staff.id } });
      expect(stillThere?.deletedAt).toBeNull();
    });

    it('soft-deletes a STAFF member on a matching confirmEmail', async () => {
      const staff = await createUser('STAFF');

      const res = await request(app)
        .delete(`/api/tenants/users/${staff.id}`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({ confirmEmail: staff.email });

      expect(res.status).toBe(204);

      const deleted = await prisma.user.findUnique({ where: { id: staff.id } });
      expect(deleted?.deletedAt).not.toBeNull();
      expect(deleted?.isActive).toBe(false);
      expect(deleted?.email).not.toBe(staff.email);
    });

    it('deletes a sole Business Owner directly, leaving the workspace intact', async () => {
      const owner = await createUser('BUSINESS_OWNER');

      const res = await request(app)
        .delete(`/api/tenants/users/${owner.id}`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({ confirmEmail: owner.email });

      expect(res.status).toBe(204);

      const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
      expect(tenant).not.toBeNull();
    });

    it('requires newOwnerId (409) when deleting a Business Owner with active staff, then transfers ownership permanently', async () => {
      const owner = await createUser('BUSINESS_OWNER');
      const staff = await createUser('STAFF');

      const withoutOwner = await request(app)
        .delete(`/api/tenants/users/${owner.id}`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({ confirmEmail: owner.email });
      expect(withoutOwner.status).toBe(409);
      expect(withoutOwner.body.code).toBe('OWNERSHIP_TRANSFER_REQUIRED');

      const res = await request(app)
        .delete(`/api/tenants/users/${owner.id}`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({ confirmEmail: owner.email, newOwnerId: staff.id });

      expect(res.status).toBe(204);

      const promotedStaff = await prisma.user.findUnique({ where: { id: staff.id } });
      expect(promotedStaff?.role).toBe('BUSINESS_OWNER');

      const deletedOwner = await prisma.user.findUnique({ where: { id: owner.id } });
      expect(deletedOwner?.deletedAt).not.toBeNull();

      // Deletion's ownership transfer is permanent — no OwnershipTransfer row,
      // unlike suspension.
      const transfer = await prisma.ownershipTransfer.findFirst({ where: { originalOwnerId: owner.id } });
      expect(transfer).toBeNull();
    });
  });

  describe('ownership transfer candidates', () => {
    it('lists only active staff in the target Business Owner\'s tenant', async () => {
      const owner = await createUser('BUSINESS_OWNER');
      const staff = await createUser('STAFF');
      await createUser('STAFF', { isActive: false });

      const res = await request(app)
        .get(`/api/tenants/users/${owner.id}/ownership-transfer-candidates`)
        .set('Authorization', `Bearer ${superAdminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.items).toHaveLength(1);
      expect(res.body.items[0].id).toBe(staff.id);
    });
  });
});
