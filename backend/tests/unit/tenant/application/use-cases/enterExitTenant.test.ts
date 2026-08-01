import { EnterTenantUseCase } from '@tenant/application/use-cases/EnterTenantUseCase';
import { ExitTenantUseCase } from '@tenant/application/use-cases/ExitTenantUseCase';
import { ITenantRepository } from '@tenant/domain/repositories/ITenantRepository';
import { IUserRepository } from '@auth/domain/repositories/IUserRepository';
import { ITokenService, TokenPayload } from '@auth/application/ports/ITokenService';
import { Tenant } from '@tenant/domain/entities/Tenant';
import { User } from '@auth/domain/entities/User';
import { SubscriptionStatus } from '@tenant/domain/enums/SubscriptionStatus';
import { UserRole } from '@auth/domain/enums/UserRole';
import { UnauthorizedError } from '@auth/domain/errors';
import { TenantNotFoundError, TenantSuspendedError } from '@tenant/domain/errors';

/**
 * The workspace-entry session swap.
 *
 * The property that matters is that a platform administrator inside a workspace
 * looks, to every other part of the system, exactly like that workspace's owner
 * — scoped to ONE tenant, not exempt from scoping. These tests assert on the
 * minted payload, because that payload is what `resolveTenant` and every
 * role check downstream will read.
 */
describe('entering and leaving a workspace', () => {
  const admin = User.create({
    id: 'admin-1',
    email: 'admin@platform.test',
    hashedPassword: 'x',
    role: UserRole.SUPER_ADMIN,
    tenantId: null,
    createdAt: new Date(),
  });

  const tenant = Tenant.create({
    id: 'tenant-a',
    name: 'Acme',
    urlSlug: 'acme',
    createdAt: new Date(),
  });

  let tenantRepository: jest.Mocked<ITenantRepository>;
  let userRepository: jest.Mocked<IUserRepository>;
  let tokenService: jest.Mocked<ITokenService>;
  let signed: TokenPayload;

  beforeEach(() => {
    tenantRepository = { findById: jest.fn().mockResolvedValue(tenant) } as any;
    userRepository = { findById: jest.fn().mockResolvedValue(admin) } as any;
    tokenService = {
      sign: jest.fn().mockImplementation((p: TokenPayload) => {
        signed = p;
        return 'token';
      }),
      verify: jest.fn(),
    } as any;
  });

  describe('EnterTenantUseCase', () => {
    const enter = () =>
      new EnterTenantUseCase(tenantRepository, userRepository, tokenService).execute({
        callerUserId: 'admin-1',
        callerRole: UserRole.SUPER_ADMIN,
        tenantId: 'tenant-a',
      });

    it('mints a token scoped to the entered workspace, reading as its owner', async () => {
      const result = await enter();

      expect(result.tenantSlug).toBe('acme');
      expect(signed.role).toBe(UserRole.BUSINESS_OWNER);
      expect(signed.tenantId).toBe('tenant-a');
      expect(signed.tenantSlug).toBe('acme');
    });

    // Anything written inside the workspace must be attributable to the person
    // who wrote it, not to a client's staff member.
    it('keeps the administrator’s own userId', async () => {
      await enter();
      expect(signed.userId).toBe('admin-1');
      expect(signed.impersonatorId).toBe('admin-1');
      expect(signed.impersonatorEmail).toBe('admin@platform.test');
    });

    it('refuses a caller who is not a platform administrator', async () => {
      await expect(
        new EnterTenantUseCase(tenantRepository, userRepository, tokenService).execute({
          callerUserId: 'someone',
          callerRole: UserRole.BUSINESS_OWNER,
          tenantId: 'tenant-a',
        })
      ).rejects.toThrow(UnauthorizedError);
      expect(tokenService.sign).not.toHaveBeenCalled();
    });

    // `authenticate` never reads the database, so a token outlives the account
    // change it should have been invalidated by. This is the point where that is
    // caught, at the cost of one query.
    it('refuses a deactivated administrator even with a valid token', async () => {
      userRepository.findById.mockResolvedValue(
        User.create({ ...(admin as any), isActive: false, id: 'admin-1', tenantId: null })
      );
      await expect(enter()).rejects.toThrow(UnauthorizedError);
    });

    it('refuses a suspended workspace — reactivate it first', async () => {
      tenantRepository.findById.mockResolvedValue(
        Tenant.create({
          id: 'tenant-a',
          name: 'Acme',
          urlSlug: 'acme',
          subscriptionStatus: SubscriptionStatus.SUSPENDED,
          createdAt: new Date(),
        })
      );
      await expect(enter()).rejects.toThrow(TenantSuspendedError);
      expect(tokenService.sign).not.toHaveBeenCalled();
    });

    it('404s on a workspace that does not exist', async () => {
      tenantRepository.findById.mockResolvedValue(null);
      await expect(enter()).rejects.toThrow(TenantNotFoundError);
    });
  });

  describe('ExitTenantUseCase', () => {
    it('returns a plain platform token with no tenant and no impersonation claims', async () => {
      await new ExitTenantUseCase(userRepository, tokenService).execute({
        impersonatorId: 'admin-1',
      });

      expect(signed.role).toBe(UserRole.SUPER_ADMIN);
      expect(signed.tenantId).toBeNull();
      expect(signed.tenantSlug).toBeNull();
      expect(signed.impersonatorId).toBeUndefined();
    });

    // Guards the one thing that makes this route safe to expose to a caller
    // whose token reads BUSINESS_OWNER: without the claim, there is nothing to
    // escalate from.
    it('refuses a caller holding an ordinary session', async () => {
      await expect(
        new ExitTenantUseCase(userRepository, tokenService).execute({ impersonatorId: undefined })
      ).rejects.toThrow(UnauthorizedError);
      expect(tokenService.sign).not.toHaveBeenCalled();
    });

    it('refuses if the administrator is no longer a platform administrator', async () => {
      userRepository.findById.mockResolvedValue(
        User.create({
          id: 'admin-1',
          email: 'admin@platform.test',
          hashedPassword: 'x',
          role: UserRole.BUSINESS_OWNER,
          tenantId: 'tenant-a',
          createdAt: new Date(),
        })
      );
      await expect(
        new ExitTenantUseCase(userRepository, tokenService).execute({ impersonatorId: 'admin-1' })
      ).rejects.toThrow(UnauthorizedError);
    });
  });
});
