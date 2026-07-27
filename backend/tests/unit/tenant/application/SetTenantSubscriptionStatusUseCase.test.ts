import { SetTenantSubscriptionStatusUseCase } from '@tenant/application/use-cases/SetTenantSubscriptionStatusUseCase';
import { ITenantRepository } from '@tenant/domain/repositories/ITenantRepository';
import { SubscriptionStatus } from '@tenant/domain/enums/SubscriptionStatus';
import { Tenant } from '@tenant/domain/entities/Tenant';
import { TenantNotFoundError } from '@tenant/domain/errors';
import { UnauthorizedError } from '@auth/domain/errors';
import { UserRole } from '@auth/domain/enums/UserRole';

describe('SetTenantSubscriptionStatusUseCase', () => {
  let tenantRepo: jest.Mocked<ITenantRepository>;

  const tenantWith = (status: SubscriptionStatus) =>
    Tenant.create({
      id: 't-1',
      name: 'Acme',
      urlSlug: 'acme',
      subscriptionStatus: status,
      createdAt: new Date(),
    });

  const suspend = () =>
    new SetTenantSubscriptionStatusUseCase(tenantRepo, SubscriptionStatus.SUSPENDED);
  const reactivate = () =>
    new SetTenantSubscriptionStatusUseCase(tenantRepo, SubscriptionStatus.ACTIVE);

  beforeEach(() => {
    tenantRepo = {
      findById: jest.fn(),
      findBySlug: jest.fn(),
      create: jest.fn(),
      findAll: jest.fn(),
      updateSettings: jest.fn(),
      setSubscriptionStatus: jest.fn().mockResolvedValue(undefined),
    } as unknown as jest.Mocked<ITenantRepository>;
  });

  describe('role gating', () => {
    it.each([UserRole.BUSINESS_OWNER, UserRole.STAFF])(
      'refuses %s even for their own tenant',
      async (role) => {
        tenantRepo.findById.mockResolvedValue(tenantWith(SubscriptionStatus.ACTIVE));

        await expect(suspend().execute({ callerRole: role, tenantId: 't-1' })).rejects.toThrow(
          UnauthorizedError
        );

        // Refused before any read or write — a rejected caller learns nothing
        // about whether the tenant even exists.
        expect(tenantRepo.findById).not.toHaveBeenCalled();
        expect(tenantRepo.setSubscriptionStatus).not.toHaveBeenCalled();
      }
    );

    it('allows SUPER_ADMIN', async () => {
      tenantRepo.findById.mockResolvedValue(tenantWith(SubscriptionStatus.ACTIVE));

      await suspend().execute({ callerRole: UserRole.SUPER_ADMIN, tenantId: 't-1' });

      expect(tenantRepo.setSubscriptionStatus).toHaveBeenCalledWith('t-1', 'SUSPENDED');
    });
  });

  it('throws TenantNotFoundError for an unknown tenant, writing nothing', async () => {
    tenantRepo.findById.mockResolvedValue(null);

    await expect(
      suspend().execute({ callerRole: UserRole.SUPER_ADMIN, tenantId: 'nope' })
    ).rejects.toThrow(TenantNotFoundError);
    expect(tenantRepo.setSubscriptionStatus).not.toHaveBeenCalled();
  });

  describe('suspending', () => {
    it('suspends an active tenant', async () => {
      tenantRepo.findById
        .mockResolvedValueOnce(tenantWith(SubscriptionStatus.ACTIVE))
        .mockResolvedValueOnce(tenantWith(SubscriptionStatus.SUSPENDED));

      const result = await suspend().execute({
        callerRole: UserRole.SUPER_ADMIN,
        tenantId: 't-1',
      });

      expect(tenantRepo.setSubscriptionStatus).toHaveBeenCalledWith('t-1', 'SUSPENDED');
      expect(result.isSuspended()).toBe(true);
    });

    it('is idempotent: suspending an already-suspended tenant succeeds and writes nothing', async () => {
      tenantRepo.findById.mockResolvedValue(tenantWith(SubscriptionStatus.SUSPENDED));

      const result = await suspend().execute({
        callerRole: UserRole.SUPER_ADMIN,
        tenantId: 't-1',
      });

      // A double-click, a retry after a timeout, or two admins acting at once
      // must not produce an error suggesting something went wrong.
      expect(result.isSuspended()).toBe(true);
      expect(tenantRepo.setSubscriptionStatus).not.toHaveBeenCalled();
    });
  });

  describe('reactivating', () => {
    it('reactivates a suspended tenant', async () => {
      tenantRepo.findById
        .mockResolvedValueOnce(tenantWith(SubscriptionStatus.SUSPENDED))
        .mockResolvedValueOnce(tenantWith(SubscriptionStatus.ACTIVE));

      const result = await reactivate().execute({
        callerRole: UserRole.SUPER_ADMIN,
        tenantId: 't-1',
      });

      expect(tenantRepo.setSubscriptionStatus).toHaveBeenCalledWith('t-1', 'ACTIVE');
      expect(result.isSuspended()).toBe(false);
    });

    it('is idempotent: reactivating an active tenant succeeds and writes nothing', async () => {
      tenantRepo.findById.mockResolvedValue(tenantWith(SubscriptionStatus.ACTIVE));

      const result = await reactivate().execute({
        callerRole: UserRole.SUPER_ADMIN,
        tenantId: 't-1',
      });

      expect(result.isSuspended()).toBe(false);
      expect(tenantRepo.setSubscriptionStatus).not.toHaveBeenCalled();
    });
  });

  it('never deletes or deactivates anything — suspension only flips the status', async () => {
    /*
     * Guards the scope line drawn for this feature: suspension retains all
     * data. The repository handed in exposes no delete at all, so the check
     * that matters is that the ONLY write performed is the status flip.
     */
    tenantRepo.findById.mockResolvedValue(tenantWith(SubscriptionStatus.ACTIVE));

    await suspend().execute({ callerRole: UserRole.SUPER_ADMIN, tenantId: 't-1' });

    expect(tenantRepo.updateSettings).not.toHaveBeenCalled();
    expect(tenantRepo.create).not.toHaveBeenCalled();
    expect(tenantRepo.setSubscriptionStatus).toHaveBeenCalledTimes(1);
  });
});
