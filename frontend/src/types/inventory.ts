export interface Warehouse {
  id: string;
  name: string;
  address?: string | null;
}

export interface Category {
  id: string;
  name: string;
  description?: string;
  isArchived?: boolean;
}

export interface CategoryWithItemCount {
  category: Category;
  itemCount: number;
}

export interface StockLevel {
  id: string;
  warehouseId: string;
  productId: string;
  quantity: number;
  warehouse?: Warehouse;
}

/** A product's stock at one location, as returned alongside the product. */
export interface StockBreakdownEntry {
  warehouseId: string;
  warehouseName: string;
  quantity: number;
}

export interface ProductImage {
  id: string;
  url: string;
  url2x: string;
  /** Ready-made `srcset` value covering both renditions. */
  srcSet: string;
  width: number;
  height: number;
  bytes: number;
  position: number;
}

/**
 * Availability is derived from stock on hand. ARCHIVED is a stored flag that
 * outranks it — an archived product is out of the catalogue however much of it
 * is sitting in a warehouse.
 */
export type ProductAvailability = 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK';
export type ProductStatus = ProductAvailability | 'ARCHIVED';

export interface Product {
  id: string;
  name: string;
  description: string;
  sku: string | null;
  brand: string | null;
  categoryId: string | null;
  categoryName: string | null;
  price: number;
  cost: number | null;
  tags: string[];
  lowStockThreshold: number;
  isArchived: boolean;
  totalUnits: number;
  availability: ProductAvailability;
  status: ProductStatus;
  images: ProductImage[];
  stockBreakdown: StockBreakdownEntry[];
  createdAt: string;
  updatedAt: string;
}

/** Catalogue totals for the KPI strip, computed over the active filters. */
export interface ProductSummary {
  totalProducts: number;
  outOfStock: number;
  lowStock: number;
  archived: number;
  inventoryValue: number;
  inventoryCost: number;
  totalUnits: number;
}

export interface ProductPage {
  items: Product[];
  total: number;
  page: number;
  pageSize: number;
  summary: ProductSummary;
}

export type ProductSortField =
  | 'name'
  | 'sku'
  | 'price'
  | 'cost'
  | 'stock'
  | 'createdAt'
  | 'updatedAt';

export type SortDirection = 'asc' | 'desc';

export interface ProductFilters {
  query?: string;
  categoryId?: string;
  warehouseId?: string;
  brand?: string;
  tags?: string[];
  status?: ProductStatus;
  includeArchived?: boolean;
  sortBy?: ProductSortField;
  sortDirection?: SortDirection;
  page?: number;
  pageSize?: number;
}

/** Everything the create/edit form submits. */
export interface ProductInput {
  name: string;
  description: string;
  sku?: string | null;
  brand?: string | null;
  categoryId?: string | null;
  price: number;
  cost?: number | null;
  tags?: string[];
  lowStockThreshold?: number;
  isArchived?: boolean;
}

export interface CreateProductInput extends ProductInput {
  initialStock: { warehouseId: string; quantity: number }[];
}

export interface ProductFacets {
  brands: string[];
  tags: string[];
}

export type BulkProductAction = 'archive' | 'unarchive' | 'delete';

export interface BulkProductResult {
  succeeded: string[];
  failed: { id: string; name?: string; reason: string }[];
}

export interface StockMovement {
  id: string;
  productId: string;
  fromWarehouseId?: string | null;
  toWarehouseId?: string | null;
  quantity: number;
  type: string;
  reason?: string | null;
  createdAt?: string;
}

/** Human-readable labels for each status, used by badges and filters. */
export const PRODUCT_STATUS_LABELS: Record<ProductStatus, string> = {
  IN_STOCK: 'In Stock',
  LOW_STOCK: 'Low Stock',
  OUT_OF_STOCK: 'Out of Stock',
  ARCHIVED: 'Archived',
};
