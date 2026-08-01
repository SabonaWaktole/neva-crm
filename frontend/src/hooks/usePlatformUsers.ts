import { useCallback, useEffect, useState } from 'react';
import { dashboardService } from '../services/dashboardService';
import type {
  PlatformUser,
  PlatformUserFilters,
  CreatePlatformUserInput,
} from '../services/dashboardService';

/**
 * Every account on the platform, for the admin console's People page.
 *
 * The only cross-workspace read in the app. Filters live in state here rather
 * than in the page so a refetch after creating a user preserves whatever the
 * operator was looking at.
 */
export const usePlatformUsers = (initial: PlatformUserFilters = {}) => {
  const [filters, setFilters] = useState<PlatformUserFilters>({ take: 50, ...initial });
  const [users, setUsers] = useState<PlatformUser[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = useCallback(async (next: PlatformUserFilters) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await dashboardService.getPlatformUsers(next);
      setUsers(data.items);
      setTotal(data.total);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load users');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers(filters);
  }, [filters, fetchUsers]);

  return {
    users,
    total,
    isLoading,
    error,
    filters,
    setFilters,
    refresh: useCallback(() => fetchUsers(filters), [fetchUsers, filters]),
  };
};

/**
 * Creating an account from the console, in a chosen workspace.
 *
 * Separate from the listing hook for the same reason `useTenantAdmin` is
 * separate from `useTenants`: reading and writing have different loading and
 * error lifecycles, and the server's message on a rejected create (duplicate
 * email, weak password) is what the operator needs to see.
 */
export const useCreatePlatformUser = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createUser = useCallback(
    async (tenantId: string, input: CreatePlatformUserInput): Promise<PlatformUser | null> => {
      setIsSubmitting(true);
      setError(null);
      try {
        return await dashboardService.createPlatformUser(tenantId, input);
      } catch (err: any) {
        setError(err.response?.data?.error || 'Could not create the account.');
        return null;
      } finally {
        setIsSubmitting(false);
      }
    },
    []
  );

  return {
    createUser,
    isSubmitting,
    error,
    clearError: useCallback(() => setError(null), []),
  };
};
