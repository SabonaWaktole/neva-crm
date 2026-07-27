import { apiClient } from '../api';

export interface DashboardMetrics {
  totalClients: number;
  totalClientsLastWeek: number;
  /** Appointments scheduled for today, excluding cancelled ones. */
  appointmentsToday: number;
  /** Same window yesterday, for the day-over-day delta. */
  appointmentsYesterday: number;
  /** Quotations that are neither accepted, rejected nor expired. */
  openQuotations: number;
  quotationsAwaitingApproval: number;
  /** Products at or below their low-stock threshold. */
  lowStockProducts: number;
  outOfStockProducts: number;
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

/**
 * Whether a workspace may operate. SUSPENDED retains all data — a suspended
 * tenant's users simply cannot log in or reach any endpoint. There is no
 * "deleted" state: hard deletion is not implemented anywhere.
 */
export type SubscriptionStatus = 'ACTIVE' | 'SUSPENDED';

export interface Tenant {
  id: string;
  name: string;
  urlSlug: string;
  subscriptionStatus: SubscriptionStatus;
  createdAt: string;
}

export interface PaginatedTenants {
  items: Tenant[];
  total: number;
}

export interface CreateTenantInput {
  companyName: string;
  urlSlug: string;
  ownerEmail: string;
  ownerPassword: string;
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
  },

  /*
   * Platform administration. All three are SUPER_ADMIN-only and, like the list
   * above, live at the root /api/tenants rather than under /api/:tenantSlug —
   * they act ON tenants rather than within one.
   */

  createTenant: async (input: CreateTenantInput): Promise<Tenant> => {
    const response = await apiClient.post<{ tenant: Tenant }>(`/tenants`, input);
    return response.data.tenant;
  },

  /** Idempotent server-side: suspending an already-suspended tenant succeeds. */
  suspendTenant: async (tenantId: string): Promise<Tenant> => {
    const response = await apiClient.patch<{ tenant: Tenant }>(`/tenants/${tenantId}/suspend`);
    return response.data.tenant;
  },

  reactivateTenant: async (tenantId: string): Promise<Tenant> => {
    const response = await apiClient.patch<{ tenant: Tenant }>(`/tenants/${tenantId}/reactivate`);
    return response.data.tenant;
  }
};
