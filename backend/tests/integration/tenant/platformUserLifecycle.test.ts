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

    it('suspends a Business Owner with staff directly when the workspace has a co-owner', async () => {
      const owner = await createUser('BUSINESS_OWNER');
      const coOwner = await createUser('BUSINESS_OWNER');
      const staff = await createUser('STAFF');

      const res = await request(app)
        .patch(`/api/tenants/users/${owner.id}/suspend`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({});

      expect(res.status).toBe(200);
      expect(res.body.user.isActive).toBe(false);

      // Nobody was promoted and no transfer to resolve later: the co-owner
      // already runs the workspace.
      expect((await prisma.user.findUnique({ where: { id: staff.id } }))?.role).toBe('STAFF');
      expect((await prisma.user.findUnique({ where: { id: coOwner.id } }))?.role).toBe('BUSINESS_OWNER');
      expect(await prisma.ownershipTransfer.findFirst({ where: { originalOwnerId: owner.id } })).toBeNull();
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

    it('requires ownershipResolution (409) after a suspension that transferred ownership, then restores it', async () => {
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
        .send({ ownershipResolution: 'RESTORE' });

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
        .send({ ownershipResolution: 'KEEP' });

      expect(res.status).toBe(200);
      expect(res.body.user.role).toBe('STAFF');

      const actingOwner = await prisma.user.findUnique({ where: { id: staff.id } });
      expect(actingOwner?.role).toBe('BUSINESS_OWNER');

      const transfer = await prisma.ownershipTransfer.findFirst({ where: { originalOwnerId: owner.id } });
      expect(transfer?.status).toBe('KEPT');
    });

    it('keeps BOTH as Business Owners when chosen, demoting neither', async () => {
      const owner = await createUser('BUSINESS_OWNER');
      const staff = await createUser('STAFF');

      await request(app)
        .patch(`/api/tenants/users/${owner.id}/suspend`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({ newOwnerId: staff.id });

      const res = await request(app)
        .patch(`/api/tenants/users/${owner.id}/reactivate`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({ ownershipResolution: 'KEEP_BOTH' });

      expect(res.status).toBe(200);
      expect(res.body.user.isActive).toBe(true);
      expect(res.body.user.role).toBe('BUSINESS_OWNER');

      // The temporary owner stays exactly where the suspension left them —
      // the workspace now genuinely has two Business Owners.
      const actingOwner = await prisma.user.findUnique({ where: { id: staff.id } });
      expect(actingOwner?.role).toBe('BUSINESS_OWNER');

      const owners = await prisma.user.findMany({ where: { tenantId, role: 'BUSINESS_OWNER', isActive: true } });
      expect(owners.map((u) => u.id).sort()).toEqual([owner.id, staff.id].sort());

      const transfer = await prisma.ownershipTransfer.findFirst({ where: { originalOwnerId: owner.id } });
      expect(transfer?.status).toBe('KEPT_BOTH');
      expect(transfer?.resolvedAt).not.toBeNull();
    });

    it('rejects an unknown ownershipResolution with 400', async () => {
      const staff = await createUser('STAFF', { isActive: false });

      const res = await request(app)
        .patch(`/api/tenants/users/${staff.id}/reactivate`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({ ownershipResolution: 'DELETE_EVERYONE' });

      expect(res.status).toBe(400);
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

    it('deletes a Business Owner with staff directly when the workspace has a co-owner', async () => {
      const owner = await createUser('BUSINESS_OWNER');
      await createUser('BUSINESS_OWNER');
      const staff = await createUser('STAFF');

      const res = await request(app)
        .delete(`/api/tenants/users/${owner.id}`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({ confirmEmail: owner.email });

      expect(res.status).toBe(204);
      expect((await prisma.user.findUnique({ where: { id: staff.id } }))?.role).toBe('STAFF');
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

    it('lists nobody while the workspace has another active Business Owner', async () => {
      const owner = await createUser('BUSINESS_OWNER');
      await createUser('BUSINESS_OWNER');
      await createUser('STAFF');

      const res = await request(app)
        .get(`/api/tenants/users/${owner.id}/ownership-transfer-candidates`)
        .set('Authorization', `Bearer ${superAdminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.items).toEqual([]);
    });
  });

  /**
   * The third way to become a Business Owner: invited straight from the
   * platform console. Promotion from staff and an invitation from an existing
   * owner are the other two, and both live under /api/:tenantSlug/auth.
   */
  describe('invite', () => {
    const invitedEmails: string[] = [];

    const inviteEmail = () => {
      const email = `invited-${uuidv4().slice(0, 8)}@test.com`;
      invitedEmails.push(email);
      return email;
    };

    afterEach(async () => {
      await prisma.invitation.deleteMany({ where: { tenantId } });
      invitedEmails.length = 0;
    });

    it('creates a BUSINESS_OWNER invitation by default, without echoing the token', async () => {
      const email = inviteEmail();

      const res = await request(app)
        .post(`/api/tenants/${tenantId}/invitations`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({ email });

      expect(res.status).toBe(201);
      expect(res.body.invitation).toEqual({ email, role: 'BUSINESS_OWNER' });
      expect(JSON.stringify(res.body)).not.toContain('token');

      const invitation = await prisma.invitation.findFirst({ where: { tenantId, email } });
      expect(invitation?.role).toBe('BUSINESS_OWNER');
      expect(invitation?.acceptedAt).toBeNull();
    });

    it('adds an owner rather than replacing the existing one', async () => {
      const owner = await createUser('BUSINESS_OWNER');
      const email = inviteEmail();

      await request(app)
        .post(`/api/tenants/${tenantId}/invitations`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({ email })
        .expect(201);

      const stillOwner = await prisma.user.findUnique({ where: { id: owner.id } });
      expect(stillOwner?.role).toBe('BUSINESS_OWNER');
      expect(stillOwner?.isActive).toBe(true);
    });

    it('accepts an explicit STAFF role', async () => {
      const email = inviteEmail();

      const res = await request(app)
        .post(`/api/tenants/${tenantId}/invitations`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({ email, role: 'STAFF' });

      expect(res.status).toBe(201);
      expect(res.body.invitation.role).toBe('STAFF');
    });

    it('rejects SUPER_ADMIN as a role with 400', async () => {
      const res = await request(app)
        .post(`/api/tenants/${tenantId}/invitations`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({ email: inviteEmail(), role: 'SUPER_ADMIN' });

      expect(res.status).toBe(400);
    });

    it('rejects a non-SUPER_ADMIN caller with 403', async () => {
      const owner = await createUser('BUSINESS_OWNER');

      const res = await request(app)
        .post(`/api/tenants/${tenantId}/invitations`)
        .set('Authorization', `Bearer ${tokenFor(owner.id, 'BUSINESS_OWNER')}`)
        .send({ email: inviteEmail() });

      expect(res.status).toBe(403);
    });

    it('returns 404 for an unknown workspace', async () => {
      const res = await request(app)
        .post(`/api/tenants/${uuidv4()}/invitations`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({ email: inviteEmail() });

      expect(res.status).toBe(404);
    });

    it('returns 409 when the invitee already has an account in that workspace', async () => {
      const existing = await createUser('STAFF');

      const res = await request(app)
        .post(`/api/tenants/${tenantId}/invitations`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({ email: existing.email });

      expect(res.status).toBe(409);
      expect(res.body.code).toBe('USER_ALREADY_IN_WORKSPACE');
    });

    it('returns 409 on a duplicate pending invitation', async () => {
      const email = inviteEmail();

      await request(app)
        .post(`/api/tenants/${tenantId}/invitations`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({ email })
        .expect(201);

      const res = await request(app)
        .post(`/api/tenants/${tenantId}/invitations`)
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({ email });

      expect(res.status).toBe(409);
      expect(res.body.code).toBe('INVITATION_ALREADY_PENDING');
    });
  });
});
