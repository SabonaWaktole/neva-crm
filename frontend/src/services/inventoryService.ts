import { apiClient } from '../api';
import type { Product, StockLevel, StockMovement, Category, Warehouse } from '../types/inventory';

export const inventoryService = {
  // PRODUCTS
  searchProducts: async (tenantSlug: string, query?: string, categoryId?: string, inStockOnly?: boolean): Promise<Product[]> => {
    const params = new URLSearchParams();
    if (query) params.append('query', query);
    if (categoryId) params.append('categoryId', categoryId);
    if (inStockOnly) params.append('inStockOnly', 'true');
    
    const response = await apiClient.get(`/${tenantSlug}/inventory/products?${params.toString()}`);
    return response.data;
  },

  getProduct: async (tenantSlug: string, productId: string): Promise<Product> => {
    // Search returns array, find the specific one. Alternatively, if a getById endpoint exists, use it.
    // Assuming searchProducts can filter by query precisely or we can just fetch all and find (not ideal for large sets).
    // Wait, backend doesn't have a specific getById, but searchProducts returns details. 
    // For now, let's use the search endpoint with the exact name or just rely on the frontend state if possible.
    // Actually, Milestone 4 backend has searchProducts which returns all products if no query is provided.
    // A proper getById is missing from the controller, so we'll fetch all and filter for now, or just use search with name.
    const products = await inventoryService.searchProducts(tenantSlug);
    const product = products.find(p => p.id === productId);
    if (!product) throw new Error('Product not found');
    return product;
  },

  createProduct: async (tenantSlug: string, data: Omit<Product, 'id' | 'createdAt' | 'updatedAt' | 'tenantId'> & { initialStock?: { warehouseId: string; quantity: number }[] }): Promise<Product> => {
    const response = await apiClient.post(`/${tenantSlug}/inventory/products`, data);
    return response.data;
  },

  updateProduct: async (tenantSlug: string, productId: string, data: Partial<Omit<Product, 'id' | 'createdAt' | 'updatedAt' | 'tenantId'>>): Promise<Product> => {
    const response = await apiClient.put(`/${tenantSlug}/inventory/products/${productId}`, data);
    return response.data;
  },

  // STOCK
  getStockBreakdown: async (tenantSlug: string, productId: string): Promise<StockLevel[]> => {
    const response = await apiClient.get(`/${tenantSlug}/inventory/products/${productId}/stock`);
    return response.data;
  },

  adjustStock: async (tenantSlug: string, productId: string, data: { warehouseId: string; quantity: number; reason?: string }): Promise<StockMovement> => {
    const response = await apiClient.post(`/${tenantSlug}/inventory/products/${productId}/adjust`, data);
    return response.data;
  },

  transferStock: async (tenantSlug: string, productId: string, data: { fromWarehouseId: string; toWarehouseId: string; quantity: number; reason?: string }): Promise<StockMovement> => {
    const response = await apiClient.post(`/${tenantSlug}/inventory/products/${productId}/transfer`, data);
    return response.data;
  },

  // WAREHOUSES
  getWarehouses: async (tenantSlug: string): Promise<Warehouse[]> => {
    const response = await apiClient.get(`/${tenantSlug}/inventory/warehouses`);
    return response.data;
  },

  createWarehouse: async (tenantSlug: string, data: { name: string; address?: string }): Promise<Warehouse> => {
    const response = await apiClient.post(`/${tenantSlug}/inventory/warehouses`, data);
    return response.data;
  },

  updateWarehouse: async (tenantSlug: string, warehouseId: string, data: { name?: string; address?: string }): Promise<Warehouse> => {
    const response = await apiClient.put(`/${tenantSlug}/inventory/warehouses/${warehouseId}`, data);
    return response.data;
  },

  deleteWarehouse: async (tenantSlug: string, warehouseId: string): Promise<void> => {
    await apiClient.delete(`/${tenantSlug}/inventory/warehouses/${warehouseId}`);
  },

  // CATEGORIES
  getCategories: async (tenantSlug: string): Promise<Category[]> => {
    const response = await apiClient.get(`/${tenantSlug}/inventory/categories`);
    return response.data;
  },

  createCategory: async (tenantSlug: string, data: { name: string }): Promise<Category> => {
    const response = await apiClient.post(`/${tenantSlug}/inventory/categories`, data);
    return response.data;
  },

  updateCategory: async (tenantSlug: string, categoryId: string, data: { name: string }): Promise<Category> => {
    const response = await apiClient.put(`/${tenantSlug}/inventory/categories/${categoryId}`, data);
    return response.data;
  },

  deleteCategory: async (tenantSlug: string, categoryId: string): Promise<void> => {
    await apiClient.delete(`/${tenantSlug}/inventory/categories/${categoryId}`);
  }
};
