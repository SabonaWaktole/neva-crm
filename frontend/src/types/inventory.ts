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

export interface Product {
  id: string;
  name: string;
  description: string;
  sku: string;
  price: number;
  lowStockThreshold?: number;
  status: string;
  totalUnits: number;
  categoryId?: string | null;
  category?: Category | null;
  stockBreakdown?: StockLevel[];
  createdAt?: string;
  updatedAt?: string;
  tenantId?: string;
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
