import { useState, useCallback } from 'react';
import { inventoryService } from '../services/inventoryService';
import { useParams } from 'react-router-dom';
import type { Product, StockLevel, Category, Warehouse } from '../types/inventory';
import { useDebounce } from './useDebounce';

// ========================
// PRODUCTS
// ========================

export const useProducts = (filters?: { query?: string; categoryId?: string; inStockOnly?: boolean }) => {
  const { tenantSlug } = useParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const debouncedQuery = useDebounce(filters?.query, 300);

  const fetchProducts = useCallback(async () => {
    if (!tenantSlug) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await inventoryService.searchProducts(tenantSlug, debouncedQuery, filters?.categoryId, filters?.inStockOnly);
      setProducts(data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch products');
    } finally {
      setIsLoading(false);
    }
  }, [tenantSlug, debouncedQuery, filters?.categoryId, filters?.inStockOnly]);

  return { products, isLoading, error, fetchProducts };
};

export const useProductStock = (productId?: string) => {
  const { tenantSlug } = useParams();
  const [stockLevels, setStockLevels] = useState<StockLevel[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStock = useCallback(async () => {
    if (!tenantSlug || !productId) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await inventoryService.getStockBreakdown(tenantSlug, productId);
      setStockLevels(data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch stock levels');
    } finally {
      setIsLoading(false);
    }
  }, [tenantSlug, productId]);

  return { stockLevels, isLoading, error, fetchStock };
};

export const useCreateProduct = () => {
  const { tenantSlug } = useParams();
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createProduct = async (data: Parameters<typeof inventoryService.createProduct>[1]) => {
    if (!tenantSlug) throw new Error('Missing tenant context');
    setIsPending(true);
    setError(null);
    try {
      return await inventoryService.createProduct(tenantSlug, data);
    } catch (err: any) {
      const msg = err.response?.data?.error || 'Failed to create product';
      setError(msg);
      throw err;
    } finally {
      setIsPending(false);
    }
  };

  return { createProduct, isPending, error };
};

export const useUpdateProduct = () => {
  const { tenantSlug } = useParams();
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateProduct = async (productId: string, data: Parameters<typeof inventoryService.updateProduct>[2]) => {
    if (!tenantSlug) throw new Error('Missing tenant context');
    setIsPending(true);
    setError(null);
    try {
      return await inventoryService.updateProduct(tenantSlug, productId, data);
    } catch (err: any) {
      const msg = err.response?.data?.error || 'Failed to update product';
      setError(msg);
      throw err;
    } finally {
      setIsPending(false);
    }
  };

  return { updateProduct, isPending, error };
};

// ========================
// STOCK OPERATIONS
// ========================

export const useAdjustStock = () => {
  const { tenantSlug } = useParams();
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const adjustStock = async (productId: string, data: Parameters<typeof inventoryService.adjustStock>[2]) => {
    if (!tenantSlug) throw new Error('Missing tenant context');
    setIsPending(true);
    setError(null);
    try {
      return await inventoryService.adjustStock(tenantSlug, productId, data);
    } catch (err: any) {
      const msg = err.response?.data?.error || 'Failed to adjust stock';
      setError(msg);
      throw err;
    } finally {
      setIsPending(false);
    }
  };

  return { adjustStock, isPending, error };
};

export const useTransferStock = () => {
  const { tenantSlug } = useParams();
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const transferStock = async (productId: string, data: Parameters<typeof inventoryService.transferStock>[2]) => {
    if (!tenantSlug) throw new Error('Missing tenant context');
    setIsPending(true);
    setError(null);
    try {
      return await inventoryService.transferStock(tenantSlug, productId, data);
    } catch (err: any) {
      const msg = err.response?.data?.error || 'Failed to transfer stock';
      setError(msg);
      throw err;
    } finally {
      setIsPending(false);
    }
  };

  return { transferStock, isPending, error };
};

// ========================
// WAREHOUSES
// ========================

export const useWarehouses = () => {
  const { tenantSlug } = useParams();
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchWarehouses = useCallback(async () => {
    if (!tenantSlug) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await inventoryService.getWarehouses(tenantSlug);
      setWarehouses(data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch warehouses');
    } finally {
      setIsLoading(false);
    }
  }, [tenantSlug]);

  return { warehouses, isLoading, error, fetchWarehouses };
};

export const useCreateWarehouse = () => {
  const { tenantSlug } = useParams();
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createWarehouse = async (data: { name: string; address?: string }) => {
    if (!tenantSlug) throw new Error('Missing tenant context');
    setIsPending(true);
    setError(null);
    try {
      return await inventoryService.createWarehouse(tenantSlug, data);
    } catch (err: any) {
      const msg = err.response?.data?.error || 'Failed to create warehouse';
      setError(msg);
      throw err;
    } finally {
      setIsPending(false);
    }
  };

  return { createWarehouse, isPending, error };
};

export const useUpdateWarehouse = () => {
  const { tenantSlug } = useParams();
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateWarehouse = async (warehouseId: string, data: { name?: string; address?: string }) => {
    if (!tenantSlug) throw new Error('Missing tenant context');
    setIsPending(true);
    setError(null);
    try {
      return await inventoryService.updateWarehouse(tenantSlug, warehouseId, data);
    } catch (err: any) {
      const msg = err.response?.data?.error || 'Failed to update warehouse';
      setError(msg);
      throw err;
    } finally {
      setIsPending(false);
    }
  };

  return { updateWarehouse, isPending, error };
};

export const useDeleteWarehouse = () => {
  const { tenantSlug } = useParams();
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const deleteWarehouse = async (warehouseId: string) => {
    if (!tenantSlug) throw new Error('Missing tenant context');
    setIsPending(true);
    setError(null);
    try {
      return await inventoryService.deleteWarehouse(tenantSlug, warehouseId);
    } catch (err: any) {
      const msg = err.response?.data?.error || 'Failed to delete warehouse';
      setError(msg);
      throw err;
    } finally {
      setIsPending(false);
    }
  };

  return { deleteWarehouse, isPending, error };
};

// ========================
// CATEGORIES
// ========================

export const useCategories = () => {
  const { tenantSlug } = useParams();
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCategories = useCallback(async () => {
    if (!tenantSlug) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await inventoryService.getCategories(tenantSlug);
      setCategories(data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch categories');
    } finally {
      setIsLoading(false);
    }
  }, [tenantSlug]);

  return { categories, isLoading, error, fetchCategories };
};

export const useCreateCategory = () => {
  const { tenantSlug } = useParams();
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createCategory = async (data: { name: string }) => {
    if (!tenantSlug) throw new Error('Missing tenant context');
    setIsPending(true);
    setError(null);
    try {
      return await inventoryService.createCategory(tenantSlug, data);
    } catch (err: any) {
      const msg = err.response?.data?.error || 'Failed to create category';
      setError(msg);
      throw err;
    } finally {
      setIsPending(false);
    }
  };

  return { createCategory, isPending, error };
};

export const useUpdateCategory = () => {
  const { tenantSlug } = useParams();
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateCategory = async (categoryId: string, data: { name: string }) => {
    if (!tenantSlug) throw new Error('Missing tenant context');
    setIsPending(true);
    setError(null);
    try {
      return await inventoryService.updateCategory(tenantSlug, categoryId, data);
    } catch (err: any) {
      const msg = err.response?.data?.error || 'Failed to update category';
      setError(msg);
      throw err;
    } finally {
      setIsPending(false);
    }
  };

  return { updateCategory, isPending, error };
};

export const useDeleteCategory = () => {
  const { tenantSlug } = useParams();
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const deleteCategory = async (categoryId: string) => {
    if (!tenantSlug) throw new Error('Missing tenant context');
    setIsPending(true);
    setError(null);
    try {
      return await inventoryService.deleteCategory(tenantSlug, categoryId);
    } catch (err: any) {
      const msg = err.response?.data?.error || 'Failed to delete category';
      setError(msg);
      throw err;
    } finally {
      setIsPending(false);
    }
  };

  return { deleteCategory, isPending, error };
};
