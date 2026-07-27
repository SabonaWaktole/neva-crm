import { apiClient } from '../api';
import type {
  Product,
  ProductPage,
  ProductFilters,
  ProductFacets,
  ProductImage,
  CreateProductInput,
  ProductInput,
  BulkProductAction,
  BulkProductResult,
  StockLevel,
  StockMovement,
  Category,
  CategoryWithItemCount,
} from '../types/inventory';

/** Turns an axios failure into something worth showing a user. */
export const toInventoryError = (error: any): string => {
  const serverMessage = error?.response?.data?.error;
  if (typeof serverMessage === 'string') return serverMessage;
  if (Array.isArray(serverMessage) && serverMessage[0]?.message) return serverMessage[0].message;
  if (error?.response?.status === 413) return 'That image is too large.';
  if (error?.response?.status === 415) return 'That image format is not supported.';
  if (error?.code === 'ERR_NETWORK') return 'Network error — check your connection and try again.';
  return error?.message || 'Something went wrong. Please try again.';
};

const buildProductQuery = (filters: ProductFilters = {}): string => {
  const params = new URLSearchParams();
  // The backend matches `name` against name, SKU and brand alike.
  if (filters.query) params.append('name', filters.query);
  if (filters.categoryId) params.append('categoryId', filters.categoryId);
  if (filters.warehouseId) params.append('warehouseId', filters.warehouseId);
  if (filters.brand) params.append('brand', filters.brand);
  if (filters.tags?.length) params.append('tags', filters.tags.join(','));
  if (filters.status) params.append('status', filters.status);
  if (filters.includeArchived) params.append('includeArchived', 'true');
  if (filters.sortBy) params.append('sortBy', filters.sortBy);
  if (filters.sortDirection) params.append('sortDirection', filters.sortDirection);
  if (filters.page) params.append('page', String(filters.page));
  if (filters.pageSize) params.append('pageSize', String(filters.pageSize));
  return params.toString();
};

export const inventoryService = {
  // ======================
  // PRODUCTS
  // ======================
  searchProducts: async (tenantSlug: string, filters?: ProductFilters): Promise<ProductPage> => {
    const response = await apiClient.get(
      `/${tenantSlug}/inventory/products?${buildProductQuery(filters)}`
    );
    return response.data;
  },

  getProduct: async (tenantSlug: string, productId: string): Promise<Product> => {
    const response = await apiClient.get(`/${tenantSlug}/inventory/products/${productId}`);
    return response.data;
  },

  getFacets: async (tenantSlug: string): Promise<ProductFacets> => {
    const response = await apiClient.get(`/${tenantSlug}/inventory/products/facets`);
    return response.data;
  },

  createProduct: async (tenantSlug: string, data: CreateProductInput): Promise<Product> => {
    const response = await apiClient.post(`/${tenantSlug}/inventory/products`, data);
    return response.data;
  },

  updateProduct: async (
    tenantSlug: string,
    productId: string,
    data: Partial<ProductInput>
  ): Promise<Product> => {
    const response = await apiClient.put(`/${tenantSlug}/inventory/products/${productId}`, data);
    return response.data;
  },

  deleteProduct: async (tenantSlug: string, productId: string): Promise<void> => {
    await apiClient.delete(`/${tenantSlug}/inventory/products/${productId}`);
  },

  bulkAction: async (
    tenantSlug: string,
    ids: string[],
    action: BulkProductAction
  ): Promise<BulkProductResult> => {
    const response = await apiClient.post(`/${tenantSlug}/inventory/products/bulk`, { ids, action });
    return response.data;
  },

  // ======================
  // PRODUCT IMAGES
  // ======================
  /**
   * `onProgress` receives 0–100. Axios reports real progress for a FormData
   * body because the total size is known, so the bar is not simulated.
   */
  uploadImages: async (
    tenantSlug: string,
    productId: string,
    files: (File | Blob)[],
    onProgress?: (percent: number) => void,
    signal?: AbortSignal
  ): Promise<ProductImage[]> => {
    const form = new FormData();
    files.forEach((file, index) => {
      // Blobs out of the compressor have no name; the server rejects unnamed parts.
      form.append('files', file, file instanceof File ? file.name : `product-${index}.webp`);
    });

    const response = await apiClient.post(
      `/${tenantSlug}/inventory/products/${productId}/images`,
      form,
      {
        signal,
        onUploadProgress: (event) => {
          if (!onProgress || !event.total) return;
          onProgress(Math.round((event.loaded / event.total) * 100));
        },
      }
    );
    return response.data;
  },

  deleteImage: async (
    tenantSlug: string,
    productId: string,
    imageId: string
  ): Promise<ProductImage[]> => {
    const response = await apiClient.delete(
      `/${tenantSlug}/inventory/products/${productId}/images/${imageId}`
    );
    return response.data;
  },

  reorderImages: async (
    tenantSlug: string,
    productId: string,
    imageIds: string[]
  ): Promise<ProductImage[]> => {
    const response = await apiClient.put(
      `/${tenantSlug}/inventory/products/${productId}/images/order`,
      { imageIds }
    );
    return response.data;
  },

  // ======================
  // STOCK
  // ======================
  getStockBreakdown: async (tenantSlug: string, productId: string): Promise<StockLevel[]> => {
    const response = await apiClient.get(
      `/${tenantSlug}/inventory/products/${productId}/stock-breakdown`
    );
    return response.data;
  },

  adjustStock: async (
    tenantSlug: string,
    productId: string,
    data: { warehouseId: string; quantityChange: number; reason?: string }
  ): Promise<StockMovement> => {
    const response = await apiClient.post(
      `/${tenantSlug}/inventory/products/${productId}/adjust`,
      data
    );
    return response.data;
  },

  transferStock: async (
    tenantSlug: string,
    productId: string,
    data: { fromWarehouseId: string; toWarehouseId: string; quantity: number; reason?: string }
  ): Promise<StockMovement> => {
    const response = await apiClient.post(
      `/${tenantSlug}/inventory/products/${productId}/transfer`,
      data
    );
    return response.data;
  },

  // ======================
  // CATEGORIES
  // ======================
  getCategories: async (
    tenantSlug: string,
    includeArchived?: boolean
  ): Promise<CategoryWithItemCount[]> => {
    const params = new URLSearchParams();
    if (includeArchived) params.append('includeArchived', 'true');
    const response = await apiClient.get(
      `/${tenantSlug}/inventory/categories?${params.toString()}`
    );
    return response.data;
  },

  createCategory: async (
    tenantSlug: string,
    data: { name: string; description?: string }
  ): Promise<Category> => {
    const response = await apiClient.post(`/${tenantSlug}/inventory/categories`, data);
    return response.data;
  },

  updateCategory: async (
    tenantSlug: string,
    categoryId: string,
    data: { name?: string; description?: string }
  ): Promise<Category> => {
    const response = await apiClient.put(
      `/${tenantSlug}/inventory/categories/${categoryId}`,
      data
    );
    return response.data;
  },

  deleteCategory: async (tenantSlug: string, categoryId: string): Promise<void> => {
    await apiClient.delete(`/${tenantSlug}/inventory/categories/${categoryId}`);
  },

  /**
   * What cleanup would archive, without archiving it. The count shown next to
   * the button must come from here rather than being derived separately in the
   * UI — that divergence is how a fabricated "3" ended up labelling a real
   * destructive action. See TD-027.
   */
  previewCategoryCleanup: async (
    tenantSlug: string
  ): Promise<{ count: number; categories: { id: string; name: string }[] }> => {
    const response = await apiClient.get(`/${tenantSlug}/inventory/categories/cleanup/preview`);
    return response.data;
  },

  cleanupCategories: async (
    tenantSlug: string
  ): Promise<{ count: number; categories: { id: string; name: string }[] }> => {
    const response = await apiClient.post(`/${tenantSlug}/inventory/categories/cleanup`);
    return response.data;
  },
};
