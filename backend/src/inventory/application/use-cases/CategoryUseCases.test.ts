import { CreateCategoryUseCase } from './CreateCategoryUseCase';
import { UpdateCategoryUseCase } from './UpdateCategoryUseCase';
import { DeleteCategoryUseCase } from './DeleteCategoryUseCase';
import { ICategoryRepository, IProductRepository } from '../../domain/repositories';
import { Category } from '../../domain/Category';
import { UserRole } from '../../../auth/domain/enums/UserRole';
import { CategoryInUseError } from '../../domain/inUseErrors';

describe('Category Use Cases (Business Owner only)', () => {
  let categoryRepo: jest.Mocked<ICategoryRepository>;
  let productRepo: jest.Mocked<IProductRepository>;

  beforeEach(() => {
    categoryRepo = {
      findById: jest.fn(),
      findAllByTenantId: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
    };
    productRepo = {
      findById: jest.fn(),
      save: jest.fn(),
      search: jest.fn(),
      countByCategoryId: jest.fn(),
    };
  });

  // ===== CreateCategoryUseCase =====
  describe('CreateCategoryUseCase', () => {
    let createUseCase: CreateCategoryUseCase;

    beforeEach(() => {
      createUseCase = new CreateCategoryUseCase(categoryRepo);
    });

    it('should create a category (BUSINESS_OWNER)', async () => {
      const result = await createUseCase.execute({
        tenantId: 'tenant1',
        name: 'Electronics',
        authorRole: UserRole.BUSINESS_OWNER
      });

      expect(result.name).toBe('Electronics');
      expect(result.tenantId).toBe('tenant1');
      expect(categoryRepo.save).toHaveBeenCalledTimes(1);
    });

    it('should reject STAFF', async () => {
      await expect(createUseCase.execute({
        tenantId: 'tenant1',
        name: 'Electronics',
        authorRole: UserRole.STAFF
      })).rejects.toThrow('Unauthorized: Only Business Owners can manage categories.');
    });

    it('should reject SUPER_ADMIN', async () => {
      await expect(createUseCase.execute({
        tenantId: 'tenant1',
        name: 'Electronics',
        authorRole: UserRole.SUPER_ADMIN
      })).rejects.toThrow('Unauthorized');
    });
  });

  // ===== UpdateCategoryUseCase =====
  describe('UpdateCategoryUseCase', () => {
    let updateUseCase: UpdateCategoryUseCase;

    beforeEach(() => {
      updateUseCase = new UpdateCategoryUseCase(categoryRepo);
    });

    it('should update a category (BUSINESS_OWNER)', async () => {
      categoryRepo.findById.mockResolvedValue(Category.create({
        id: 'c1', tenantId: 'tenant1', name: 'Old Name'
      }));

      const result = await updateUseCase.execute({
        tenantId: 'tenant1',
        id: 'c1',
        name: 'New Name',
        authorRole: UserRole.BUSINESS_OWNER
      });

      expect(result.name).toBe('New Name');
      expect(categoryRepo.save).toHaveBeenCalledTimes(1);
    });

    it('should reject STAFF', async () => {
      await expect(updateUseCase.execute({
        tenantId: 'tenant1',
        id: 'c1',
        name: 'New Name',
        authorRole: UserRole.STAFF
      })).rejects.toThrow('Unauthorized');
    });

    it('should enforce tenant isolation: reject category not found for tenant', async () => {
      categoryRepo.findById.mockResolvedValue(null);

      await expect(updateUseCase.execute({
        tenantId: 'tenant1',
        id: 'c-from-tenant2',
        name: 'Hijack',
        authorRole: UserRole.BUSINESS_OWNER
      })).rejects.toThrow('Category c-from-tenant2 not found');
    });
  });

  // ===== DeleteCategoryUseCase =====
  describe('DeleteCategoryUseCase', () => {
    let deleteUseCase: DeleteCategoryUseCase;

    beforeEach(() => {
      deleteUseCase = new DeleteCategoryUseCase(categoryRepo, productRepo);
    });

    it('should delete a category with zero products assigned (BUSINESS_OWNER)', async () => {
      categoryRepo.findById.mockResolvedValue(Category.create({
        id: 'c1', tenantId: 'tenant1', name: 'Empty Category'
      }));
      productRepo.countByCategoryId.mockResolvedValue(0);

      await deleteUseCase.execute({
        tenantId: 'tenant1',
        id: 'c1',
        authorRole: UserRole.BUSINESS_OWNER
      });

      expect(categoryRepo.delete).toHaveBeenCalledWith('tenant1', 'c1');
    });

    it('should block deletion when category is assigned to products (CategoryInUseError)', async () => {
      categoryRepo.findById.mockResolvedValue(Category.create({
        id: 'c1', tenantId: 'tenant1', name: 'Popular Category'
      }));
      productRepo.countByCategoryId.mockResolvedValue(5); // 5 products use this category

      await expect(deleteUseCase.execute({
        tenantId: 'tenant1',
        id: 'c1',
        authorRole: UserRole.BUSINESS_OWNER
      })).rejects.toThrow(CategoryInUseError);

      // Confirm delete was NEVER called
      expect(categoryRepo.delete).not.toHaveBeenCalled();
    });

    it('should reject STAFF', async () => {
      await expect(deleteUseCase.execute({
        tenantId: 'tenant1',
        id: 'c1',
        authorRole: UserRole.STAFF
      })).rejects.toThrow('Unauthorized');
    });

    it('should reject SUPER_ADMIN', async () => {
      await expect(deleteUseCase.execute({
        tenantId: 'tenant1',
        id: 'c1',
        authorRole: UserRole.SUPER_ADMIN
      })).rejects.toThrow('Unauthorized');
    });
  });
});
