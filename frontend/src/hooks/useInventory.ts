import { useState, useCallback } from 'react';
import { inventoryService } from '../services/inventoryService';
import { useParams } from 'react-router-dom';
import type { Product, StockLevel } from '../types/inventory';
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


