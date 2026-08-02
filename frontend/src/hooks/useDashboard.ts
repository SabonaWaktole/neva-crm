import { useState, useCallback, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { dashboardService } from '../services/dashboardService';
import type {
  DashboardMetrics,
  ActivityFeedItem,
  Tenant,
  CreateTenantInput,
} from '../services/dashboardService';

export const useDashboardMetrics = () => {
  const { tenantSlug } = useParams();
  const activeTenant = tenantSlug as string;

  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMetrics = useCallback(async () => {
    if (!activeTenant) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await dashboardService.getTenantClientMetrics(activeTenant);
      setMetrics(data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch metrics');
    } finally {
      setIsLoading(false);
    }
  }, [activeTenant]);

  useEffect(() => {
    fetchMetrics();
  }, [fetchMetrics]);

  return { metrics, isLoading, error, fetchMetrics };
};

export const useActivityFeed = (limit: number = 10) => {
  const { tenantSlug } = useParams();
  const activeTenant = tenantSlug as string;

  const [activities, setActivities] = useState<ActivityFeedItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchFeed = useCallback(async (fetchLimit: number) => {
    if (!activeTenant) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await dashboardService.getTenantActivityFeed(activeTenant, fetchLimit);
      setActivities(data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch activity feed');
    } finally {
      setIsLoading(false);
    }
  }, [activeTenant]);

  useEffect(() => {
    fetchFeed(limit);
  }, [limit, fetchFeed]);

  return { activities, isLoading, error, fetchFeed };
};

export const useTenants = (skip: number = 0, take: number = 50) => {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTenants = useCallback(async (skipCount: number, takeCount: number) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await dashboardService.getTenants(skipCount, takeCount);
      setTenants(data.items);
      setTotal(data.total);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch tenants');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTenants(skip, take);
  }, [skip, take, fetchTenants]);

  return { tenants, total, isLoading, error, fetchTenants };
};

/**
 * The Super Admin's write actions against tenants.
 *
 * Separate from `useTenants` because reading the list and mutating it have
 * different lifecycles: the list owns its own loading state and refetch, while
 * these report per-action progress and errors. Each returns the updated tenant
 * so a caller can patch its row without a full refetch, and `error` is the
 * server's message rather than a generic one — a 409 on a duplicate slug is
 * something the operator needs to read.
 */
export const useTenantAdmin = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = useCallback(async <T,>(action: () => Promise<T>): Promise<T | null> => {
    setIsSubmitting(true);
    setError(null);
    try {
      return await action();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Something went wrong. Please try again.');
      return null;
    } finally {
      setIsSubmitting(false);
    }
  }, []);

  const createTenant = useCallback(
    (input: CreateTenantInput) => run(() => dashboardService.createTenant(input)),
    [run]
  );

  const suspendTenant = useCallback(
    (tenantId: string) => run(() => dashboardService.suspendTenant(tenantId)),
    [run]
  );

  const reactivateTenant = useCallback(
    (tenantId: string) => run(() => dashboardService.reactivateTenant(tenantId)),
    [run]
  );

  /*
   * Not built on `run`: `run` reports failure as a `null` return, which is
   * indistinguishable from `deleteTenant`'s own success value — a delete
   * resolves to `void`, and `void` is `null`-ish too. This returns a real
   * boolean instead, so a caller can tell success from failure without that
   * ambiguity.
   */
  const deleteTenant = useCallback(async (tenantId: string, confirmSlug: string) => {
    setIsSubmitting(true);
    setError(null);
    try {
      await dashboardService.deleteTenant(tenantId, confirmSlug);
      return true;
    } catch (err: any) {
      setError(err.response?.data?.error || 'Something went wrong. Please try again.');
      return false;
    } finally {
      setIsSubmitting(false);
    }
  }, []);

  return {
    createTenant,
    suspendTenant,
    reactivateTenant,
    deleteTenant,
    isSubmitting,
    error,
    clearError: useCallback(() => setError(null), []),
  };
};
