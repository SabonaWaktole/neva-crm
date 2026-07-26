import { SearchProductsUseCase } from './SearchProductsUseCase';
import {
  IProductRepository,
  ProductSearchResult,
  ProductSummary,
  ProductWithStock,
} from '../../domain/repositories';
import { Product } from '../../domain/Product';
import { UserRole } from '../../../auth/domain/enums/UserRole';

describe('SearchProductsUseCase', () => {
  let useCase: SearchProductsUseCase;
  let productRepo: jest.Mocked<IProductRepository>;

  beforeEach(() => {
    productRepo = {
      findById: jest.fn(),
      findBySku: jest.fn(),
      findManyByIds: jest.fn(),
      findWithStock: jest.fn(),
      save: jest.fn(),
      saveMany: jest.fn(),
      delete: jest.fn(),
      search: jest.fn(),
      summarise: jest.fn(),
      countByCategoryId: jest.fn(),
      countQuotationReferences: jest.fn(),
      listBrands: jest.fn(),
      listTags: jest.fn(),
    };
    useCase = new SearchProductsUseCase(productRepo);
  });

  function makeProduct(id: string, threshold: number = 10): Product {
    return Product.create({
      id, tenantId: 'tenant1', name: `Product ${id}`,
      description: 'Desc', categoryId: null, price: 100,
      lowStockThreshold: threshold
    });
  }

  function makeResult(product: Product, totalStock: number): ProductWithStock {
    let availability: 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK';
    if (totalStock === 0) {
      availability = 'OUT_OF_STOCK';
    } else if (totalStock <= product.lowStockThreshold) {
      availability = 'LOW_STOCK';
    } else {
      availability = 'IN_STOCK';
    }
    return {
      product,
      totalStock,
      availability,
      status: product.isArchived ? 'ARCHIVED' : availability,
      categoryName: null,
      images: [],
    };
  }

  const emptySummary: ProductSummary = {
    totalProducts: 0, outOfStock: 0, lowStock: 0, archived: 0,
    inventoryValue: 0, inventoryCost: 0, totalUnits: 0,
  };

  /** The repository returns a page envelope; the tests only care about items. */
  function page(items: ProductWithStock[]): ProductSearchResult {
    return { items, total: items.length, page: 1, pageSize: items.length };
  }

  beforeEach(() => {
    productRepo.summarise.mockResolvedValue(emptySummary);
  });

  it('should search products and return results', async () => {
    const p1 = makeProduct('p1');
    productRepo.search.mockResolvedValue(page([makeResult(p1, 50)]));

    const results = await useCase.execute({
      tenantId: 'tenant1',
      name: 'Product',
      authorRole: UserRole.STAFF,
      authorWarehouseId: 'w1'
    });

    expect(results.items.length).toBe(1);
    expect(results.total).toBe(1);
    expect(results.items[0].product.id).toBe('p1');
    expect(productRepo.search).toHaveBeenCalledWith('tenant1', expect.objectContaining({
      name: 'Product',
      categoryId: undefined,
      warehouseId: 'w1',
      availability: undefined,
    }));
  });

  // ===== BOUNDARY TESTS FOR AVAILABILITY =====
  // Availability definition:
  //   Total > threshold  => IN_STOCK
  //   0 < Total <= threshold => LOW_STOCK
  //   Total == 0 => OUT_OF_STOCK

  it('BOUNDARY: totalStock exactly AT threshold => LOW_STOCK', async () => {
    const p = makeProduct('p-at', 10); // threshold = 10
    const result = makeResult(p, 10);  // totalStock = 10 (exactly at threshold)
    productRepo.search.mockResolvedValue(page([result]));

    const results = await useCase.execute({
      tenantId: 'tenant1',
      authorRole: UserRole.STAFF,
      authorWarehouseId: 'w1'
    });

    expect(results.items[0].availability).toBe('LOW_STOCK');
    expect(results.items[0].totalStock).toBe(10);
  });

  it('BOUNDARY: totalStock one unit ABOVE threshold => IN_STOCK', async () => {
    const p = makeProduct('p-above', 10); // threshold = 10
    const result = makeResult(p, 11);      // totalStock = 11
    productRepo.search.mockResolvedValue(page([result]));

    const results = await useCase.execute({
      tenantId: 'tenant1',
      authorRole: UserRole.STAFF,
      authorWarehouseId: 'w1'
    });

    expect(results.items[0].availability).toBe('IN_STOCK');
    expect(results.items[0].totalStock).toBe(11);
  });

  it('BOUNDARY: totalStock one unit BELOW threshold => LOW_STOCK', async () => {
    const p = makeProduct('p-below', 10); // threshold = 10
    const result = makeResult(p, 9);       // totalStock = 9
    productRepo.search.mockResolvedValue(page([result]));

    const results = await useCase.execute({
      tenantId: 'tenant1',
      authorRole: UserRole.STAFF,
      authorWarehouseId: 'w1'
    });

    expect(results.items[0].availability).toBe('LOW_STOCK');
    expect(results.items[0].totalStock).toBe(9);
  });

  it('BOUNDARY: totalStock exactly ZERO => OUT_OF_STOCK', async () => {
    const p = makeProduct('p-zero', 10); // threshold = 10
    const result = makeResult(p, 0);      // totalStock = 0
    productRepo.search.mockResolvedValue(page([result]));

    const results = await useCase.execute({
      tenantId: 'tenant1',
      authorRole: UserRole.STAFF,
      authorWarehouseId: 'w1'
    });

    expect(results.items[0].availability).toBe('OUT_OF_STOCK');
    expect(results.items[0].totalStock).toBe(0);
  });

  it('should pass availability filter to the repository', async () => {
    productRepo.search.mockResolvedValue(page([]));

    await useCase.execute({
      tenantId: 'tenant1',
      availability: 'LOW_STOCK',
      authorRole: UserRole.STAFF,
      authorWarehouseId: 'w1'
    });

    expect(productRepo.search).toHaveBeenCalledWith('tenant1', expect.objectContaining({
      availability: 'LOW_STOCK'
    }));
  });

  it('should reject unauthorized roles', async () => {
    await expect(useCase.execute({
      tenantId: 'tenant1',
      authorRole: UserRole.SUPER_ADMIN as any
    })).rejects.toThrow('Unauthorized: Only Business Owners and Staff can search products.');
  });
});
