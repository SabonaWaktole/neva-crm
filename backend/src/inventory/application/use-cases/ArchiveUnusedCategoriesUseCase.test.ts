import { ArchiveUnusedCategoriesUseCase } from './ArchiveUnusedCategoriesUseCase';
import { ICategoryRepository } from '../../domain/repositories';
import { Category } from '../../domain/Category';
import { UserRole } from '../../../auth/domain/enums/UserRole';

describe('ArchiveUnusedCategoriesUseCase', () => {
  let categoryRepo: jest.Mocked<ICategoryRepository>;
  let useCase: ArchiveUnusedCategoriesUseCase;

  beforeEach(() => {
    categoryRepo = {
      findById: jest.fn(),
      findAllByTenantId: jest.fn(),
      findAllWithItemCount: jest.fn(),
      findLeastRecentlyUsedCategories: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };
    useCase = new ArchiveUnusedCategoriesUseCase(categoryRepo);
  });

  it('should allow BUSINESS_OWNER to archive categories', async () => {
    const cat1 = Category.create({ id: 'c1', tenantId: 'tenant1', name: 'Cat A' });
    const cat2 = Category.create({ id: 'c2', tenantId: 'tenant1', name: 'Cat B' });
    categoryRepo.findLeastRecentlyUsedCategories.mockResolvedValue([cat1, cat2]);

    const result = await useCase.execute({
      tenantId: 'tenant1',
      authorRole: UserRole.BUSINESS_OWNER
    });

    expect(result.count).toBe(2);
    expect(cat1.isArchived).toBe(true);
    expect(cat2.isArchived).toBe(true);
    expect(categoryRepo.update).toHaveBeenCalledTimes(2);
    expect(categoryRepo.findLeastRecentlyUsedCategories).toHaveBeenCalledWith('tenant1', 3);
  });

  it('should reject non-business owners', async () => {
    await expect(useCase.execute({
      tenantId: 'tenant1',
      authorRole: UserRole.STAFF
    })).rejects.toThrow('Unauthorized');
  });
});
