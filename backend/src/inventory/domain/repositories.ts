import { Product } from './Product';
import { ProductImage } from './ProductImage';
import { Category } from './Category';
import { Warehouse } from './Warehouse';
import { StockLevel } from './StockLevel';
import { StockMovement } from './StockMovement';

export type AvailabilityStatus = 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK';

/**
 * What the UI calls "status". Availability is derived from stock on hand;
 * ARCHIVED is a stored flag that outranks it, because an archived product is
 * out of the catalogue no matter how many units are sitting in a warehouse.
 */
export type ProductStatus = AvailabilityStatus | 'ARCHIVED';

export type ProductSortField = 'name' | 'sku' | 'price' | 'cost' | 'stock' | 'createdAt' | 'updatedAt';
export type SortDirection = 'asc' | 'desc';

export interface ProductSearchFilters {
  /** Free-text match across name, SKU and brand. */
  name?: string;
  categoryId?: string;
  warehouseId?: string;
  brand?: string;
  /** Products carrying *all* of these tags. */
  tags?: string[];
  availability?: AvailabilityStatus;
  status?: ProductStatus;
  /** Archived products are hidden unless explicitly asked for. */
  includeArchived?: boolean;
  sortBy?: ProductSortField;
  sortDirection?: SortDirection;
  /** One-based. Omit both to get the whole result set. */
  page?: number;
  pageSize?: number;
}

export interface ProductWithStock {
  product: Product;
  totalStock: number;
  availability: AvailabilityStatus;
  /** ARCHIVED when the product is archived, otherwise `availability`. */
  status: ProductStatus;
  images: ProductImage[];
  stockBreakdown?: Array<{ warehouseId: string; warehouseName: string; quantity: number }>;
}

export interface ProductSearchResult {
  items: ProductWithStock[];
  /** Matches before pagination — what the pager needs to size itself. */
  total: number;
  page: number;
  pageSize: number;
}

/** Catalogue-wide totals, computed over the same filters as the current search. */
export interface ProductSummary {
  totalProducts: number;
  outOfStock: number;
  lowStock: number;
  archived: number;
  /** Sum of price x units on hand across all matching products. */
  inventoryValue: number;
  /** Sum of cost x units on hand; only products with a cost contribute. */
  inventoryCost: number;
  totalUnits: number;
}

export interface IProductRepository {
  findById(tenantId: string, id: string): Promise<Product | null>;
  findBySku(tenantId: string, sku: string): Promise<Product | null>;
  findManyByIds(tenantId: string, ids: string[]): Promise<Product[]>;
  findWithStock(tenantId: string, id: string): Promise<ProductWithStock | null>;
  save(product: Product): Promise<void>;
  saveMany(products: Product[]): Promise<void>;
  delete(tenantId: string, id: string): Promise<void>;
  search(tenantId: string, filters: ProductSearchFilters): Promise<ProductSearchResult>;
  summarise(tenantId: string, filters: ProductSearchFilters): Promise<ProductSummary>;
  countByCategoryId(tenantId: string, categoryId: string): Promise<number>;
  countQuotationReferences(tenantId: string, productId: string): Promise<number>;
  /** Distinct non-empty brands, for the filter dropdown. */
  listBrands(tenantId: string): Promise<string[]>;
  /** Distinct tags across the catalogue, for the filter dropdown. */
  listTags(tenantId: string): Promise<string[]>;
}

export interface IProductImageRepository {
  findByProductId(tenantId: string, productId: string): Promise<ProductImage[]>;
  findById(tenantId: string, id: string): Promise<ProductImage | null>;
  save(image: ProductImage): Promise<void>;
  delete(tenantId: string, id: string): Promise<void>;
  /** Persists a new ordering. `ids` is the gallery in its intended order. */
  reorder(tenantId: string, productId: string, ids: string[]): Promise<void>;
  /** Next free slot at the end of a product's gallery. */
  nextPosition(tenantId: string, productId: string): Promise<number>;
  countByProductId(tenantId: string, productId: string): Promise<number>;
}

export interface CategoryWithItemCount {
  category: Category;
  itemCount: number;
}

export interface ICategoryRepository {
  findById(tenantId: string, id: string): Promise<Category | null>;
  findAllByTenantId(tenantId: string, includeArchived?: boolean): Promise<Category[]>;
  findAllWithItemCount(tenantId: string, includeArchived?: boolean): Promise<CategoryWithItemCount[]>;
  findLeastRecentlyUsedCategories(tenantId: string, limit: number): Promise<Category[]>;
  save(category: Category): Promise<void>;
  update(category: Category): Promise<void>;
  delete(tenantId: string, id: string): Promise<void>;
}

export interface IWarehouseRepository {
  findById(tenantId: string, id: string): Promise<Warehouse | null>;
  findAllByTenantId(tenantId: string): Promise<Warehouse[]>;
  save(warehouse: Warehouse): Promise<void>;
  update(warehouse: Warehouse): Promise<void>;
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
