import { UpdateProductUseCase } from './UpdateProductUseCase';
import { IProductRepository } from '../../domain/repositories';
import { Product } from '../../domain/Product';
import { UserRole } from '../../../auth/domain/enums/UserRole';

describe('UpdateProductUseCase', () => {
  let useCase: UpdateProductUseCase;
  let productRepo: jest.Mocked<IProductRepository>;

  beforeEach(() => {
    productRepo = {
      findById: jest.fn(),
      save: jest.fn(),
      search: jest.fn(),
      countByCategoryId: jest.fn(),
    };
    useCase = new UpdateProductUseCase(productRepo);
  });

  it('should update product fields successfully', async () => {
    const existingProduct = Product.create({
      id: 'p1', tenantId: 'tenant1', name: 'Old Name', description: 'Old Desc', categoryId: null, price: 100
    });
    productRepo.findById.mockResolvedValue(existingProduct);

    const result = await useCase.execute({
      tenantId: 'tenant1',
      id: 'p1',
      name: 'New Name',
      price: 150,
      authorRole: UserRole.BUSINESS_OWNER
    });

    expect(result.name).toBe('New Name');
    expect(result.price).toBe(150);
    expect(result.description).toBe('Old Desc'); // Unchanged
    expect(productRepo.save).toHaveBeenCalledTimes(1);
  });

  it('should explicitly ignore any attempt to pass stock levels in the payload', async () => {
    const existingProduct = Product.create({
      id: 'p1', tenantId: 'tenant1', name: 'Old Name', description: 'Old Desc', categoryId: null, price: 100
    });
    productRepo.findById.mockResolvedValue(existingProduct);

    const maliciousPayload: any = {
      tenantId: 'tenant1',
      id: 'p1',
      name: 'New Name',
      authorRole: UserRole.STAFF,
      stockLevels: [{ quantity: 9999 }] // Ignored by typescript interface, but passing to test runtime behavior
    };

    const result = await useCase.execute(maliciousPayload);

    // The product entity does not store stockLevels anyway, 
    // and the use case doesn't invoke any stock repositories.
    expect((result as any).stockLevels).toBeUndefined();
    expect(result.name).toBe('New Name');
  });

  it('should reject unauthorized roles', async () => {
    await expect(useCase.execute({
      tenantId: 'tenant1',
      id: 'p1',
      name: 'New Name',
      authorRole: UserRole.SUPER_ADMIN
    })).rejects.toThrow('Unauthorized: Only Business Owners and Staff can update products.');
  });
});
