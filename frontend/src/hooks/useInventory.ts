import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { inventoryService } from '../services/inventoryService';
import { useAuthStore } from '../store/authStore';
import { useDebounce } from './useDebounce';
import { Product, StockLevel, StockMovement, Category, Warehouse } from '../types/inventory';

// ========================
// PRODUCTS
// ========================

export function useProducts(filters?: { query?: string; categoryId?: string; inStockOnly?: boolean }) {
  const { tenantSlug } = useAuthStore();
  const debouncedQuery = useDebounce(filters?.query, 300);

  return useQuery({
    queryKey: ['products', tenantSlug, debouncedQuery, filters?.categoryId, filters?.inStockOnly],
    queryFn: () => inventoryService.searchProducts(tenantSlug!, debouncedQuery, filters?.categoryId, filters?.inStockOnly),
    enabled: !!tenantSlug,
  });
}

export function useProduct(productId?: string) {
  const { tenantSlug } = useAuthStore();
  return useQuery({
    queryKey: ['products', tenantSlug, productId],
    queryFn: () => inventoryService.getProduct(tenantSlug!, productId!),
    enabled: !!tenantSlug && !!productId,
  });
}

export function useProductStock(productId?: string) {
  const { tenantSlug } = useAuthStore();
  return useQuery({
    queryKey: ['product_stock', tenantSlug, productId],
    queryFn: () => inventoryService.getStockBreakdown(tenantSlug!, productId!),
    enabled: !!tenantSlug && !!productId,
  });
}

export function useCreateProduct() {
  const { tenantSlug } = useAuthStore();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Parameters<typeof inventoryService.createProduct>[1]) =>
      inventoryService.createProduct(tenantSlug!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products', tenantSlug] });
    },
  });
}

export function useUpdateProduct() {
  const { tenantSlug } = useAuthStore();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ productId, data }: { productId: string; data: Parameters<typeof inventoryService.updateProduct>[2] }) =>
      inventoryService.updateProduct(tenantSlug!, productId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['products', tenantSlug] });
      queryClient.invalidateQueries({ queryKey: ['products', tenantSlug, variables.productId] });
    },
  });
}

// ========================
// STOCK OPERATIONS
// ========================

export function useAdjustStock() {
  const { tenantSlug } = useAuthStore();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ productId, data }: { productId: string; data: Parameters<typeof inventoryService.adjustStock>[2] }) =>
      inventoryService.adjustStock(tenantSlug!, productId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['product_stock', tenantSlug, variables.productId] });
      queryClient.invalidateQueries({ queryKey: ['products', tenantSlug] });
    },
  });
}

export function useTransferStock() {
  const { tenantSlug } = useAuthStore();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ productId, data }: { productId: string; data: Parameters<typeof inventoryService.transferStock>[2] }) =>
      inventoryService.transferStock(tenantSlug!, productId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['product_stock', tenantSlug, variables.productId] });
      queryClient.invalidateQueries({ queryKey: ['products', tenantSlug] });
    },
  });
}

// ========================
// WAREHOUSES
// ========================

export function useWarehouses() {
  const { tenantSlug } = useAuthStore();
  return useQuery({
    queryKey: ['warehouses', tenantSlug],
    queryFn: () => inventoryService.getWarehouses(tenantSlug!),
    enabled: !!tenantSlug,
  });
}

export function useCreateWarehouse() {
  const { tenantSlug } = useAuthStore();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { name: string; address?: string }) =>
      inventoryService.createWarehouse(tenantSlug!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['warehouses', tenantSlug] });
    },
  });
}

export function useUpdateWarehouse() {
  const { tenantSlug } = useAuthStore();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ warehouseId, data }: { warehouseId: string; data: { name?: string; address?: string } }) =>
      inventoryService.updateWarehouse(tenantSlug!, warehouseId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['warehouses', tenantSlug] });
    },
  });
}

export function useDeleteWarehouse() {
  const { tenantSlug } = useAuthStore();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (warehouseId: string) => inventoryService.deleteWarehouse(tenantSlug!, warehouseId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['warehouses', tenantSlug] });
    },
  });
}

// ========================
// CATEGORIES
// ========================

export function useCategories() {
  const { tenantSlug } = useAuthStore();
  return useQuery({
    queryKey: ['categories', tenantSlug],
    queryFn: () => inventoryService.getCategories(tenantSlug!),
    enabled: !!tenantSlug,
  });
}

export function useCreateCategory() {
  const { tenantSlug } = useAuthStore();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { name: string }) =>
      inventoryService.createCategory(tenantSlug!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories', tenantSlug] });
    },
  });
}

export function useUpdateCategory() {
  const { tenantSlug } = useAuthStore();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ categoryId, data }: { categoryId: string; data: { name: string } }) =>
      inventoryService.updateCategory(tenantSlug!, categoryId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories', tenantSlug] });
    },
  });
}

export function useDeleteCategory() {
  const { tenantSlug } = useAuthStore();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (categoryId: string) => inventoryService.deleteCategory(tenantSlug!, categoryId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories', tenantSlug] });
    },
  });
}
