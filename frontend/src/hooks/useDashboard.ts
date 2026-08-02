import { useState, useCallback, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { dashboardService } from '../services/dashboardService';
import type {
  DashboardMetrics,
  ActivityFeedItem,
  Tenant,
  CreateTenantInput,
  PlatformUser,
  OwnershipTransferCandidate,
  PlatformActivityEvent,
  GlobalMrr,
  SystemHealth,
  SystemMetrics,
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

export const usePlatformActivity = (take: number = 10) => {
  const [events, setEvents] = useState<PlatformActivityEvent[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchActivity = useCallback(async (fetchTake: number) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await dashboardService.getPlatformActivity(fetchTake);
      setEvents(data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch platform activity');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchActivity(take);
  }, [take, fetchActivity]);

  return { events, isLoading, error, fetchActivity };
};

export const useGlobalMrr = () => {
  const [mrr, setMrr] = useState<GlobalMrr | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMrr = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await dashboardService.getGlobalMrr();
      setMrr(data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch global MRR');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMrr();
  }, [fetchMrr]);

  return { mrr, isLoading, error, fetchMrr };
};

export const useSystemHealth = () => {
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchHealth = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await dashboardService.getSystemHealth();
      setHealth(data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch system health');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHealth();
  }, [fetchHealth]);

  return { health, isLoading, error, fetchHealth };
};

/** Polls every 5s so the traffic panel reflects "right now" rather than the moment the page loaded. */
const SYSTEM_METRICS_POLL_INTERVAL_MS = 5000;

export const useSystemMetrics = () => {
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSystemMetrics = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await dashboardService.getSystemMetrics();
      setMetrics(data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch system metrics');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSystemMetrics();
    const intervalId = setInterval(fetchSystemMetrics, SYSTEM_METRICS_POLL_INTERVAL_MS);
    return () => clearInterval(intervalId);
  }, [fetchSystemMetrics]);

  return { metrics, isLoading, error, fetchSystemMetrics };
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

/**
 * The Super Admin's write actions against individual users, across every
 * workspace. Mirrors `useTenantAdmin` above, with one addition: suspending or
 * deleting a Business Owner with active staff, and reactivating one with an
 * unresolved ownership transfer, both 409 with a `code` the server uses to
 * say WHICH follow-up input is missing rather than just failing. `errorCode`
 * exposes that so PeoplePage can open the right picker/choice dialog instead
 * of just showing the message.
 */
export const useUserAdmin = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<string | null>(null);

  const run = useCallback(async <T,>(action: () => Promise<T>): Promise<T | null> => {
    setIsSubmitting(true);
    setError(null);
    setErrorCode(null);
    try {
      return await action();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Something went wrong. Please try again.');
      setErrorCode(err.response?.data?.code ?? null);
      return null;
    } finally {
      setIsSubmitting(false);
    }
  }, []);

  const getOwnershipTransferCandidates = useCallback(
    (userId: string): Promise<OwnershipTransferCandidate[]> =>
      dashboardService.getOwnershipTransferCandidates(userId),
    []
  );

  const suspendUser = useCallback(
    (userId: string, newOwnerId?: string): Promise<PlatformUser | null> =>
      run(() => dashboardService.suspendUser(userId, newOwnerId)),
    [run]
  );

  const reactivateUser = useCallback(
    (userId: string, restoreOwnership?: boolean): Promise<PlatformUser | null> =>
      run(() => dashboardService.reactivateUser(userId, restoreOwnership)),
    [run]
  );

  /*
   * Same reasoning as `useTenantAdmin.deleteTenant`: not built on `run`,
   * because `run`'s `null`-on-failure is ambiguous with `void`-on-success.
   */
  const deleteUser = useCallback(async (userId: string, confirmEmail: string, newOwnerId?: string) => {
    setIsSubmitting(true);
    setError(null);
    setErrorCode(null);
    try {
      await dashboardService.deleteUser(userId, confirmEmail, newOwnerId);
      return true;
    } catch (err: any) {
      setError(err.response?.data?.error || 'Something went wrong. Please try again.');
      setErrorCode(err.response?.data?.code ?? null);
      return false;
    } finally {
      setIsSubmitting(false);
    }
  }, []);

  return {
    getOwnershipTransferCandidates,
    suspendUser,
    reactivateUser,
    deleteUser,
    isSubmitting,
    error,
    errorCode,
    clearError: useCallback(() => {
      setError(null);
      setErrorCode(null);
    }, []),
  };
};
