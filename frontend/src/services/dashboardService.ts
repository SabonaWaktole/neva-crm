import { apiClient } from '../api';

export interface DashboardMetrics {
  totalClients: number;
  totalClientsLastWeek: number;
}

export interface ActivityFeedItem {
  id: string;
  timestamp: string;
  type: string;
  description: string;
  actor: {
    id: string;
    name: string;
  };
  details?: any;
}

export interface Tenant {
  id: string;
  name: string;
  urlSlug: string;
  createdAt: string;
}

export interface PaginatedTenants {
  items: Tenant[];
  total: number;
}

export const dashboardService = {
  getTenantClientMetrics: async (tenantSlug: string): Promise<DashboardMetrics> => {
    const response = await apiClient.get<DashboardMetrics>(`/${tenantSlug}/dashboard/metrics`);
    return response.data;
  },

  getTenantActivityFeed: async (tenantSlug: string, limit?: number): Promise<ActivityFeedItem[]> => {
    const params = limit ? { limit } : {};
    const response = await apiClient.get<{ timeline: ActivityFeedItem[] }>(`/${tenantSlug}/dashboard/feed`, { params });
    return response.data.timeline;
  },

  getTenants: async (skip?: number, take?: number): Promise<PaginatedTenants> => {
    const params: any = {};
    if (skip !== undefined) params.skip = skip;
    if (take !== undefined) params.take = take;
    // Note: This endpoint is mounted at the root /api/tenants, not /api/:tenantSlug/...
    const response = await apiClient.get<PaginatedTenants>(`/tenants`, { params });
    return response.data;
  }
};
