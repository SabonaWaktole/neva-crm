import { LoginUseCase } from '@auth/application/use-cases/LoginUseCase';
import { IUserRepository } from '@auth/domain/repositories/IUserRepository';
import { ITenantRepository } from '@tenant/domain/repositories/ITenantRepository';
import { IPasswordHasher } from '@auth/application/ports/IPasswordHasher';
import { ITokenService } from '@auth/application/ports/ITokenService';
import { InvalidCredentialsError } from '@auth/domain/errors';
import { UserRole } from '@auth/domain/enums/UserRole';

describe('LoginUseCase', () => {
  let useCase: LoginUseCase;
  let userRepository: jest.Mocked<IUserRepository>;
  let tenantRepository: jest.Mocked<ITenantRepository>;
  let passwordHasher: jest.Mocked<IPasswordHasher>;
  let tokenService: jest.Mocked<ITokenService>;

  beforeEach(() => {
    userRepository = {
      create: jest.fn(),
      findById: jest.fn(),
      findByEmail: jest.fn(),
      findAnyByEmail: jest.fn(),
      findByTenantId: jest.fn(),
      findSuperAdminByEmail: jest.fn(),
      updatePassword: jest.fn(),
      updateProfile: jest.fn(),
    };
    tenantRepository = {
      create: jest.fn(),
      findById: jest.fn(),
      findBySlug: jest.fn(),
      findAll: jest.fn(),
    } as any;
    passwordHasher = {
      hash: jest.fn(),
      compare: jest.fn(),
    };
    tokenService = {
      sign: jest.fn(),
      verify: jest.fn(),
    };

    useCase = new LoginUseCase(
      userRepository,
      tenantRepository,
      passwordHasher,
      tokenService
    );
  });

  it('should login a tenant user successfully', async () => {
    tenantRepository.findBySlug.mockResolvedValue({ id: 'tenant-1', urlSlug: 'acme', name: 'Acme', createdAt: new Date() } as any);
    userRepository.findByEmail.mockResolvedValue({ id: 'user-1', role: UserRole.STAFF, tenantId: 'tenant-1', hashedPassword: 'hashed' } as any);
    passwordHasher.compare.mockResolvedValue(true);
    tokenService.sign.mockReturnValue('valid-jwt-token');

    const result = await useCase.execute({
      email: 'staff@acme.com',
      password: 'Password123',
      tenantSlug: 'acme',
    });

    expect(result.token).toBe('valid-jwt-token');
    expect(tokenService.sign).toHaveBeenCalledWith(expect.objectContaining({ userId: 'user-1', role: UserRole.STAFF, tenantId: 'tenant-1' }));
  });

  it('should login a super admin successfully', async () => {
    userRepository.findAnyByEmail.mockResolvedValue({ id: 'sa-1', role: UserRole.SUPER_ADMIN, tenantId: null, hashedPassword: 'hashed' } as any);
    passwordHasher.compare.mockResolvedValue(true);
    tokenService.sign.mockReturnValue('sa-jwt-token');

    const result = await useCase.execute({
      email: 'admin@platform.com',
      password: 'Password123',
      tenantSlug: null,
    });

    expect(result.token).toBe('sa-jwt-token');
    expect(result.tenantSlug).toBe(null);
    expect(tokenService.sign).toHaveBeenCalledWith(expect.objectContaining({ userId: 'sa-1', role: UserRole.SUPER_ADMIN, tenantId: null, tenantSlug: null }));
  });

  it('should login a regular user globally and fetch tenantSlug', async () => {
    userRepository.findAnyByEmail.mockResolvedValue({ id: 'user-1', role: UserRole.STAFF, tenantId: 'tenant-1', hashedPassword: 'hashed' } as any);
    tenantRepository.findById.mockResolvedValue({ id: 'tenant-1', urlSlug: 'acme' } as any);
    passwordHasher.compare.mockResolvedValue(true);
    tokenService.sign.mockReturnValue('user-jwt-token');

    const result = await useCase.execute({
      email: 'staff@acme.com',
      password: 'Password123',
      tenantSlug: null,
    });

    expect(result.token).toBe('user-jwt-token');
    expect(result.tenantSlug).toBe('acme');
    expect(tokenService.sign).toHaveBeenCalledWith(expect.objectContaining({ userId: 'user-1', role: UserRole.STAFF, tenantId: 'tenant-1', tenantSlug: 'acme' }));
  });

  it('should throw InvalidCredentialsError on invalid password', async () => {
    tenantRepository.findBySlug.mockResolvedValue({ id: 'tenant-1' } as any);
    userRepository.findByEmail.mockResolvedValue({ id: 'user-1', role: UserRole.STAFF, tenantId: 'tenant-1', hashedPassword: 'hashed' } as any);
    passwordHasher.compare.mockResolvedValue(false);

    await expect(useCase.execute({ email: 'staff@acme.com', password: 'wrong', tenantSlug: 'acme' }))
      .rejects.toThrow(InvalidCredentialsError);
  });

  it('should throw InvalidCredentialsError if tenant slug is provided but user is SUPER_ADMIN', async () => {
    tenantRepository.findBySlug.mockResolvedValue({ id: 'tenant-1' } as any);
    userRepository.findByEmail.mockResolvedValue({ id: 'user-1', role: UserRole.SUPER_ADMIN, tenantId: null, hashedPassword: 'hashed' } as any);

    await expect(useCase.execute({ email: 'admin@platform.com', password: 'Pass', tenantSlug: 'acme' }))
      .rejects.toThrow(InvalidCredentialsError);
  });
});
