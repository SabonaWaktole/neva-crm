import { useState, useCallback, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { dashboardService } from '../services/dashboardService';
import type { DashboardMetrics, ActivityFeedItem, Tenant } from '../services/dashboardService';

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
