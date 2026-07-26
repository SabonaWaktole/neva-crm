import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { inventoryService, toInventoryError } from '../services/inventoryService';
import type {
  BulkProductAction,
  BulkProductResult,
  CreateProductInput,
  Product,
  ProductFacets,
  ProductFilters,
  ProductInput,
  ProductPage,
  ProductSummary,
  StockLevel,
} from '../types/inventory';
import { useDebounce } from './useDebounce';

const EMPTY_SUMMARY: ProductSummary = {
  totalProducts: 0,
  outOfStock: 0,
  lowStock: 0,
  archived: 0,
  inventoryValue: 0,
  inventoryCost: 0,
  totalUnits: 0,
};

// ========================
// PRODUCTS
// ========================

/**
 * The product list: a page of results, the catalogue summary, and the filters
 * that produced them.
 *
 * Typing in the search box debounces the request but not the input, so the
 * field stays responsive. Every other filter applies immediately.
 */
export const useProducts = (initialFilters: ProductFilters = {}) => {
  const { tenantSlug } = useParams();

  const [filters, setFilters] = useState<ProductFilters>({
    page: 1,
    pageSize: 20,
    sortBy: 'name',
    sortDirection: 'asc',
    ...initialFilters,
  });
  const [page, setPage] = useState<ProductPage | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const debouncedQuery = useDebounce(filters.query, 300);

  // Serialised so the effect below compares filter *values*, not the identity
  // of a fresh object on every render.
  const requestKey = useMemo(
    () => JSON.stringify({ ...filters, query: debouncedQuery }),
    [filters, debouncedQuery]
  );

  // Only the newest response may write to state; without this a slow early
  // request can land after a fast later one and show stale rows.
  const requestId = useRef(0);

  const fetchProducts = useCallback(async () => {
    if (!tenantSlug) return;
    const id = ++requestId.current;
    setIsLoading(true);
    setError(null);
    try {
      const data = await inventoryService.searchProducts(tenantSlug, {
        ...filters,
        query: debouncedQuery,
      });
      if (id === requestId.current) setPage(data);
    } catch (err: any) {
      if (id === requestId.current) setError(toInventoryError(err));
    } finally {
      if (id === requestId.current) setIsLoading(false);
    }
    // requestKey stands in for the filter values; see the memo above.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenantSlug, requestKey]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  /** Any filter change resets to page 1 — page 7 of the old result set is meaningless. */
  const updateFilters = useCallback((changes: Partial<ProductFilters>) => {
    setFilters((current) => {
      const next = { ...current, ...changes };
      if (!('page' in changes)) next.page = 1;
      return next;
    });
  }, []);

  const goToPage = useCallback((next: number) => {
    setFilters((current) => ({ ...current, page: Math.max(1, next) }));
  }, []);

  /** Clicking the current sort column flips direction; a new one starts ascending. */
  const toggleSort = useCallback((field: NonNullable<ProductFilters['sortBy']>) => {
    setFilters((current) => ({
      ...current,
      page: 1,
      sortBy: field,
      sortDirection:
        current.sortBy === field && current.sortDirection === 'asc' ? 'desc' : 'asc',
    }));
  }, []);

  /**
   * Applies a local edit to the rows already on screen. Used for optimistic
   * updates so a row reflects a change before the round trip completes.
   */
  const patchProduct = useCallback((productId: string, changes: Partial<Product>) => {
    setPage((current) =>
      current
        ? {
            ...current,
            items: current.items.map((item) =>
              item.id === productId ? { ...item, ...changes } : item
            ),
          }
        : current
    );
  }, []);

  return {
    products: page?.items ?? [],
    summary: page?.summary ?? EMPTY_SUMMARY,
    total: page?.total ?? 0,
    currentPage: page?.page ?? filters.page ?? 1,
    pageSize: page?.pageSize ?? filters.pageSize ?? 20,
    filters,
    isLoading,
    error,
    setFilters: updateFilters,
    goToPage,
    toggleSort,
    patchProduct,
    refetch: fetchProducts,
  };
};

/** One product with its stock, images and derived status. */
export const useProduct = (productId?: string) => {
  const { tenantSlug } = useParams();
  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(Boolean(productId));
  const [error, setError] = useState<string | null>(null);

  const fetchProduct = useCallback(async () => {
    if (!tenantSlug || !productId) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      setProduct(await inventoryService.getProduct(tenantSlug, productId));
    } catch (err: any) {
      setError(toInventoryError(err));
    } finally {
      setIsLoading(false);
    }
  }, [tenantSlug, productId]);

  useEffect(() => {
    fetchProduct();
  }, [fetchProduct]);

  return { product, setProduct, isLoading, error, refetch: fetchProduct };
};

/** Distinct brands and tags, for filter dropdowns and tag suggestions. */
export const useProductFacets = () => {
  const { tenantSlug } = useParams();
  const [facets, setFacets] = useState<ProductFacets>({ brands: [], tags: [] });

  const fetchFacets = useCallback(async () => {
    if (!tenantSlug) return;
    try {
      setFacets(await inventoryService.getFacets(tenantSlug));
    } catch {
      // Filter suggestions are a convenience; failing to load them must not
      // take the list down with them.
    }
  }, [tenantSlug]);

  useEffect(() => {
    fetchFacets();
  }, [fetchFacets]);

  return { facets, refetch: fetchFacets };
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
      setError(toInventoryError(err));
    } finally {
      setIsLoading(false);
    }
  }, [tenantSlug, productId]);

  return { stockLevels, isLoading, error, fetchStock };
};

// ========================
// PRODUCT MUTATIONS
// ========================

/**
 * Shared shape for the write hooks below: a pending flag, the last error, and
 * an action that rethrows so callers can branch on failure.
 */
const useMutation = <TArgs extends unknown[], TResult>(
  run: (tenantSlug: string, ...args: TArgs) => Promise<TResult>
) => {
  const { tenantSlug } = useParams();
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Callers pass a fresh arrow on every render. Holding it in a ref keeps
  // `mutate` stable, so putting it in a dependency array is safe.
  const runRef = useRef(run);
  runRef.current = run;

  const mutate = useCallback(
    async (...args: TArgs): Promise<TResult> => {
      if (!tenantSlug) throw new Error('Missing tenant context');
      setIsPending(true);
      setError(null);
      try {
        return await runRef.current(tenantSlug, ...args);
      } catch (err: any) {
        setError(toInventoryError(err));
        throw err;
      } finally {
        setIsPending(false);
      }
    },
    [tenantSlug]
  );

  return { mutate, isPending, error };
};

export const useCreateProduct = () => {
  const { mutate, isPending, error } = useMutation(
    (tenantSlug: string, data: CreateProductInput) =>
      inventoryService.createProduct(tenantSlug, data)
  );
  return { createProduct: mutate, isPending, error };
};

export const useUpdateProduct = () => {
  const { mutate, isPending, error } = useMutation(
    (tenantSlug: string, productId: string, data: Partial<ProductInput>) =>
      inventoryService.updateProduct(tenantSlug, productId, data)
  );
  return { updateProduct: mutate, isPending, error };
};

export const useDeleteProduct = () => {
  const { mutate, isPending, error } = useMutation((tenantSlug: string, productId: string) =>
    inventoryService.deleteProduct(tenantSlug, productId)
  );
  return { deleteProduct: mutate, isPending, error };
};

export const useBulkProductAction = () => {
  const { mutate, isPending, error } = useMutation(
    (tenantSlug: string, ids: string[], action: BulkProductAction): Promise<BulkProductResult> =>
      inventoryService.bulkAction(tenantSlug, ids, action)
  );
  return { runBulkAction: mutate, isPending, error };
};

// ========================
// STOCK OPERATIONS
// ========================

export const useAdjustStock = () => {
  const { mutate, isPending, error } = useMutation(
    (
      tenantSlug: string,
      productId: string,
      data: { warehouseId: string; quantityChange: number; reason?: string }
    ) => inventoryService.adjustStock(tenantSlug, productId, data)
  );
  return { adjustStock: mutate, isPending, error };
};

export const useTransferStock = () => {
  const { mutate, isPending, error } = useMutation(
    (
      tenantSlug: string,
      productId: string,
      data: { fromWarehouseId: string; toWarehouseId: string; quantity: number; reason?: string }
    ) => inventoryService.transferStock(tenantSlug, productId, data)
  );
  return { transferStock: mutate, isPending, error };
};
