import { GetOwnershipTransferCandidatesUseCase } from './GetOwnershipTransferCandidatesUseCase';
import { IUserRepository } from '../../domain/repositories/IUserRepository';
import { UserRole } from '../../domain/enums/UserRole';
import { User } from '../../domain/entities/User';
import { UnauthorizedError, UserNotFoundError, CannotModifySuperAdminError } from '../../domain/errors';

describe('GetOwnershipTransferCandidatesUseCase', () => {
  let useCase: GetOwnershipTransferCandidatesUseCase;
  let userRepository: jest.Mocked<IUserRepository>;

  const TENANT = 'tenant-1';

  const makeUser = (over: Partial<{ id: string; role: UserRole; tenantId: string | null }> = {}) =>
    User.create({
      id: over.id ?? 'owner-1',
      email: `${over.id ?? 'owner-1'}@example.com`,
      hashedPassword: 'h',
      role: over.role ?? UserRole.BUSINESS_OWNER,
      tenantId: over.tenantId === undefined ? TENANT : over.tenantId,
      isActive: true,
      createdAt: new Date(),
    });

  beforeEach(() => {
    userRepository = {
      findById: jest.fn().mockResolvedValue(makeUser()),
      findByEmail: jest.fn(),
      findAnyByEmail: jest.fn(),
      findSuperAdminByEmail: jest.fn(),
      create: jest.fn(),
      updatePassword: jest.fn(),
      updateProfile: jest.fn(),
      findByTenantId: jest.fn(),
      updateRoleAndWarehouse: jest.fn(),
      setActive: jest.fn(),
      softDelete: jest.fn(),
      countAssignedWork: jest.fn(),
      findActiveByTenantAndRole: jest.fn().mockResolvedValue([]),
      findPlatformUsers: jest.fn().mockResolvedValue({ items: [], total: 0 }),
    };
    useCase = new GetOwnershipTransferCandidatesUseCase(userRepository);
  });

  it('throws UnauthorizedError for a non-SUPER_ADMIN caller', async () => {
    await expect(
      useCase.execute({ callerRole: UserRole.BUSINESS_OWNER, userId: 'owner-1' })
    ).rejects.toThrow(UnauthorizedError);
  });

  it('throws UserNotFoundError when the target does not exist', async () => {
    userRepository.findById.mockResolvedValue(null);
    await expect(
      useCase.execute({ callerRole: UserRole.SUPER_ADMIN, userId: 'nope' })
    ).rejects.toThrow(UserNotFoundError);
  });

  it('refuses to return candidates for a SUPER_ADMIN target', async () => {
    userRepository.findById.mockResolvedValue(makeUser({ role: UserRole.SUPER_ADMIN, tenantId: null }));
    await expect(
      useCase.execute({ callerRole: UserRole.SUPER_ADMIN, userId: 'owner-1' })
    ).rejects.toThrow(CannotModifySuperAdminError);
  });

  it('returns active STAFF in the same tenant', async () => {
    const staff = makeUser({ id: 'staff-1', role: UserRole.STAFF });
    userRepository.findActiveByTenantAndRole.mockResolvedValue([staff]);

    const result = await useCase.execute({ callerRole: UserRole.SUPER_ADMIN, userId: 'owner-1' });

    expect(userRepository.findActiveByTenantAndRole).toHaveBeenCalledWith(TENANT, UserRole.STAFF);
    expect(result).toEqual([staff]);
  });
});
