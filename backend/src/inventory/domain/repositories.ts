import { Product } from './Product';
import { Category } from './Category';
import { Warehouse } from './Warehouse';
import { StockLevel } from './StockLevel';
import { StockMovement } from './StockMovement';

export type AvailabilityStatus = 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK';

export interface ProductSearchFilters {
  name?: string;
  categoryId?: string;
  warehouseId?: string;
  availability?: AvailabilityStatus;
}

export interface ProductWithStock {
  product: Product;
  totalStock: number;
  availability: AvailabilityStatus;
}

export interface IProductRepository {
  findById(tenantId: string, id: string): Promise<Product | null>;
  save(product: Product): Promise<void>;
  search(tenantId: string, filters: ProductSearchFilters): Promise<ProductWithStock[]>;
  countByCategoryId(tenantId: string, categoryId: string): Promise<number>;
}

export interface ICategoryRepository {
  findById(tenantId: string, id: string): Promise<Category | null>;
  findAllByTenantId(tenantId: string): Promise<Category[]>;
  save(category: Category): Promise<void>;
  delete(tenantId: string, id: string): Promise<void>;
}

export interface IWarehouseRepository {
  findById(tenantId: string, id: string): Promise<Warehouse | null>;
  findAllByTenantId(tenantId: string): Promise<Warehouse[]>;
  save(warehouse: Warehouse): Promise<void>;
  delete(tenantId: string, id: string): Promise<void>;
}

export interface IStockLevelRepository {
  findById(tenantId: string, id: string): Promise<StockLevel | null>;
  findByProductAndWarehouse(tenantId: string, productId: string, warehouseId: string): Promise<StockLevel | null>;
  findByProductId(tenantId: string, productId: string): Promise<StockLevel[]>;
  save(stockLevel: StockLevel): Promise<void>;
  countByWarehouseId(tenantId: string, warehouseId: string): Promise<number>;
}

export interface IStockMovementRepository {
  save(movement: StockMovement): Promise<void>;
}

export interface IStockTransactionManager {
  executeTransaction<T>(
    work: (repos: {
      stockLevelRepository: IStockLevelRepository;
      stockMovementRepository: IStockMovementRepository;
    }) => Promise<T>
  ): Promise<T>;
}
