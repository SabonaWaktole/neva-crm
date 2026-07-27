import { RegisterBusinessOwnerUseCase } from '@auth/application/use-cases/RegisterBusinessOwnerUseCase';
import { CreateTenantWithOwnerUseCase } from '@tenant/application/use-cases/CreateTenantWithOwnerUseCase';
import { IPasswordHasher } from '@auth/application/ports/IPasswordHasher';
import { UserRole } from '@auth/domain/enums/UserRole';
import { SlugAlreadyTakenError } from '@auth/domain/errors';
import {
  makeTenantProvisioningHarness,
  TenantProvisioningHarness,
} from '../../../../support/fakeTenantProvisioningTransaction';

/**
 * Public self-registration. Since this class became a thin caller over
 * `CreateTenantWithOwnerUseCase`, these tests exercise the real provisioning
 * use case underneath rather than a mock of it — the behaviour that matters to
 * a registering business is what actually gets written, not that one class
 * called another.
 */
describe('RegisterBusinessOwnerUseCase', () => {
  let useCase: RegisterBusinessOwnerUseCase;
  let harness: TenantProvisioningHarness;
  let passwordHasher: jest.Mocked<IPasswordHasher>;

  beforeEach(() => {
    harness = makeTenantProvisioningHarness();
    passwordHasher = {
      hash: jest.fn(),
      compare: jest.fn(),
    };

    useCase = new RegisterBusinessOwnerUseCase(
      new CreateTenantWithOwnerUseCase(harness.provisioningTx, passwordHasher)
    );
  });

  it('should successfully register a business owner and tenant', async () => {
    harness.tenantRepo.findBySlug.mockResolvedValue(null);
    passwordHasher.hash.mockResolvedValue('hashed-pass');

    const result = await useCase.execute({
      companyName: 'Acme Corp',
      urlSlug: 'acme-corp',
      ownerEmail: 'owner@acme.com',
      ownerPassword: 'StrongPassword123!',
    });

    expect(harness.tenantRepo.findBySlug).toHaveBeenCalledWith('acme-corp');
    expect(passwordHasher.hash).toHaveBeenCalledWith('StrongPassword123!');
    expect(harness.tenantRepo.create).toHaveBeenCalled();
    expect(harness.userRepo.create).toHaveBeenCalled();
    expect(result.tenant.name).toBe('Acme Corp');
    expect(result.user.role).toBe(UserRole.BUSINESS_OWNER);
  });

  it('should throw SlugAlreadyTakenError if the slug is taken', async () => {
    harness.tenantRepo.findBySlug.mockResolvedValue({
      id: '1',
      name: 'Existing',
      urlSlug: 'acme-corp',
      createdAt: new Date(),
    } as any);
    passwordHasher.hash.mockResolvedValue('hashed-pass');

    await expect(
      useCase.execute({
        companyName: 'Acme Corp',
        urlSlug: 'acme-corp',
        ownerEmail: 'owner@acme.com',
        ownerPassword: 'StrongPassword123!',
      })
    ).rejects.toThrow(SlugAlreadyTakenError);

    // Nothing is written when the slug is refused.
    expect(harness.tenantRepo.create).not.toHaveBeenCalled();
    expect(harness.userRepo.create).not.toHaveBeenCalled();
  });

  it('registers a newly created workspace as ACTIVE', async () => {
    harness.tenantRepo.findBySlug.mockResolvedValue(null);
    passwordHasher.hash.mockResolvedValue('hashed-pass');

    const result = await useCase.execute({
      companyName: 'Acme Corp',
      urlSlug: 'acme-corp',
      ownerEmail: 'owner@acme.com',
      ownerPassword: 'StrongPassword123!',
    });

    // A workspace that arrived suspended would be unusable from the moment it
    // was created, and its owner would have no way to tell why.
    expect(result.tenant.subscriptionStatus).toBe('ACTIVE');
    expect(result.tenant.isSuspended()).toBe(false);
  });
});
