import { RegisterBusinessOwnerUseCase } from '@auth/application/use-cases/RegisterBusinessOwnerUseCase';
import { IUserRepository } from '@auth/domain/repositories/IUserRepository';
import { ITenantRepository } from '@tenant/domain/repositories/ITenantRepository';
import { IPasswordHasher } from '@auth/application/ports/IPasswordHasher';
import { IUnitOfWork } from '@shared/application/ports/IUnitOfWork';
import { UserRole } from '@auth/domain/enums/UserRole';
import { SlugAlreadyTakenError } from '@auth/domain/errors';

describe('RegisterBusinessOwnerUseCase', () => {
  let useCase: RegisterBusinessOwnerUseCase;
  let userRepository: jest.Mocked<IUserRepository>;
  let tenantRepository: jest.Mocked<ITenantRepository>;
  let passwordHasher: jest.Mocked<IPasswordHasher>;
  let unitOfWork: jest.Mocked<IUnitOfWork>;

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
    unitOfWork = {
      execute: jest.fn().mockImplementation(async (work) => {
        return await work();
      }),
    };

    useCase = new RegisterBusinessOwnerUseCase(
      userRepository,
      tenantRepository,
      passwordHasher,
      unitOfWork
    );
  });

  it('should successfully register a business owner and tenant', async () => {
    tenantRepository.findBySlug.mockResolvedValue(null);
    passwordHasher.hash.mockResolvedValue('hashed-pass');
    
    tenantRepository.create.mockImplementation(async (tenant) => tenant);
    userRepository.create.mockImplementation(async (user) => user);

    const result = await useCase.execute({
      companyName: 'Acme Corp',
      urlSlug: 'acme-corp',
      ownerEmail: 'owner@acme.com',
      ownerPassword: 'StrongPassword123!',
      locale: 'en',
    });

    expect(tenantRepository.findBySlug).toHaveBeenCalledWith('acme-corp');
    expect(passwordHasher.hash).toHaveBeenCalledWith('StrongPassword123!');
    expect(tenantRepository.create).toHaveBeenCalled();
    expect(userRepository.create).toHaveBeenCalled();
    expect(result.tenant.name).toBe('Acme Corp');
    expect(result.user.role).toBe(UserRole.BUSINESS_OWNER);
  });

  it('should throw SlugAlreadyTakenError if the slug is taken', async () => {
    tenantRepository.findBySlug.mockResolvedValue({ id: '1', name: 'Existing', urlSlug: 'acme-corp', createdAt: new Date() } as any);

    await expect(
      useCase.execute({
        companyName: 'Acme Corp',
        urlSlug: 'acme-corp',
        ownerEmail: 'owner@acme.com',
        ownerPassword: 'StrongPassword123!',
        locale: 'en',
      })
    ).rejects.toThrow(SlugAlreadyTakenError);
  });
});
