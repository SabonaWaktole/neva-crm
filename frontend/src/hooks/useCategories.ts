import { useState, useCallback } from 'react';
import { inventoryService } from '../services/inventoryService';
import { useParams } from 'react-router-dom';
import type { CategoryWithItemCount } from '../types/inventory';

export const useCategories = (includeArchived: boolean = false) => {
  const { tenantSlug } = useParams();
  const [categories, setCategories] = useState<CategoryWithItemCount[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCategories = useCallback(async () => {
    if (!tenantSlug) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await inventoryService.getCategories(tenantSlug, includeArchived);
      setCategories(data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch categories');
    } finally {
      setIsLoading(false);
    }
  }, [tenantSlug, includeArchived]);

  return { categories, isLoading, error, fetchCategories };
};

export const useCreateCategory = () => {
  const { tenantSlug } = useParams();
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createCategory = async (data: { name: string; description?: string }) => {
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

  const updateCategory = async (categoryId: string, data: { name?: string; description?: string }) => {
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

export interface CleanupCandidate {
  id: string;
  name: string;
}

export const useArchiveCategories = () => {
  const { tenantSlug } = useParams();
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [candidates, setCandidates] = useState<CleanupCandidate[]>([]);

  /**
   * Asks the server what cleanup would archive. The UI shows this count, so the
   * number on screen and the effect of the button are the same query. TD-027.
   */
  const fetchCleanupCandidates = useCallback(async () => {
    if (!tenantSlug) return;
    try {
      const result = await inventoryService.previewCategoryCleanup(tenantSlug);
      setCandidates(result.categories);
    } catch {
      // A failed preview must not imply "nothing to clean up" — it leaves the
      // previous list alone and the button reflects whatever was last known.
    }
  }, [tenantSlug]);

  const cleanupCategories = async () => {
    if (!tenantSlug) throw new Error('Missing tenant context');
    setIsPending(true);
    setError(null);
    try {
      const result = await inventoryService.cleanupCategories(tenantSlug);
      setCandidates([]);
      return result;
    } catch (err: any) {
      const msg = err.response?.data?.error || 'Failed to cleanup categories';
      setError(msg);
      throw err;
    } finally {
      setIsPending(false);
    }
  };

  return { cleanupCategories, fetchCleanupCandidates, candidates, isPending, error };
};
