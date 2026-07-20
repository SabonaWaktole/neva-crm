import { GetCategoriesUseCase } from './GetCategoriesUseCase';
import { ICategoryRepository } from '../../domain/repositories';
import { Category } from '../../domain/Category';
import { UserRole } from '../../../auth/domain/enums/UserRole';

describe('GetCategoriesUseCase', () => {
  let categoryRepo: jest.Mocked<ICategoryRepository>;
  let useCase: GetCategoriesUseCase;

  beforeEach(() => {
    categoryRepo = {
      findById: jest.fn(),
      findAllByTenantId: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
    };
    useCase = new GetCategoriesUseCase(categoryRepo);
  });

  it('should allow BUSINESS_OWNER to list categories', async () => {
    categoryRepo.findAllByTenantId.mockResolvedValue([
      Category.create({ id: 'c1', tenantId: 'tenant1', name: 'Cat A' }),
      Category.create({ id: 'c2', tenantId: 'tenant1', name: 'Cat B' })
    ]);

    const results = await useCase.execute({
      tenantId: 'tenant1',
      authorRole: UserRole.BUSINESS_OWNER
    });

    expect(results).toHaveLength(2);
    expect(results[0].name).toBe('Cat A');
    expect(categoryRepo.findAllByTenantId).toHaveBeenCalledWith('tenant1');
  });

  it('should allow STAFF to list categories', async () => {
    categoryRepo.findAllByTenantId.mockResolvedValue([
      Category.create({ id: 'c1', tenantId: 'tenant1', name: 'Cat A' })
    ]);

    const results = await useCase.execute({
      tenantId: 'tenant1',
      authorRole: UserRole.STAFF
    });

    expect(results).toHaveLength(1);
    expect(categoryRepo.findAllByTenantId).toHaveBeenCalledWith('tenant1');
  });

  it('should reject SUPER_ADMIN from listing tenant categories', async () => {
    await expect(useCase.execute({
      tenantId: 'tenant1',
      authorRole: UserRole.SUPER_ADMIN
    })).rejects.toThrow('Unauthorized');
  });

  it('should explicitly scope query to tenantId, proving tenant isolation', async () => {
    await useCase.execute({
      tenantId: 'tenant-isolated',
      authorRole: UserRole.BUSINESS_OWNER
    });

    expect(categoryRepo.findAllByTenantId).toHaveBeenCalledTimes(1);
    expect(categoryRepo.findAllByTenantId).toHaveBeenCalledWith('tenant-isolated');
  });
});
