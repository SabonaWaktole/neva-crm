import { apiClient } from '../api';

export interface DashboardMetrics {
  totalClients: number;
  totalClientsLastWeek: number;
  /** Clients assigned to the signed-in user. Personal for every role. */
  assignedClients: number;
  /** Sent quotations still unanswered past the workspace's follow-up period. */
  openFollowUps: number;
  /** That period, in days, so the card can say what "open" means. */
  followUpThresholdDays: number;
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

/** A person as the platform console lists them — with their workspace's name. */
export interface PlatformUser {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  role: 'SUPER_ADMIN' | 'BUSINESS_OWNER' | 'STAFF';
  isActive: boolean;
  tenantId: string | null;
  /** Null for a platform administrator, who belongs to no workspace. */
  tenantName: string | null;
  createdAt: string;
}

export interface PlatformUserFilters {
  tenantId?: string;
  role?: string;
  isActive?: boolean;
  q?: string;
  skip?: number;
  take?: number;
}

export interface CreatePlatformUserInput {
  email: string;
  password: string;
  role: 'BUSINESS_OWNER' | 'STAFF';
  firstName?: string | null;
  lastName?: string | null;
}

/**
 * The six fields both platform-wide defaults and a bulk apply to selected
 * tenants can set — the same set a workspace's own Settings page edits.
 * Company identity (name, address, branding) is deliberately absent: it names
 * one business and cannot mean anything applied to several, or as a "default"
 * with no business behind it yet.
 */
export interface WorkspaceSettingsFields {
  requiresQuotationApproval?: boolean;
  currency?: string;
  locale?: string;
  timezone?: string;
  dateFormat?: string;
  defaultLanguage?: string;
}

export interface PlatformSettings extends Required<WorkspaceSettingsFields> {
  /** Null until this row has ever been saved — the platform is on the shipped defaults. */
  updatedAt: string | null;
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
  },

  /**
   * Enter a workspace and administer it as its owner.
   *
   * Replaces the session cookie server-side, so the caller must re-read
   * /auth/me before navigating — the store still holds the platform session at
   * the moment this resolves.
   */
  enterTenant: async (tenantId: string): Promise<{ tenantSlug: string; tenantName: string }> => {
    const response = await apiClient.post<{ tenantSlug: string; tenantName: string }>(
      `/tenants/${tenantId}/enter`
    );
    return response.data;
  },

  /** Every account on the platform. SUPER_ADMIN only. */
  getPlatformUsers: async (
    filters: PlatformUserFilters = {}
  ): Promise<{ items: PlatformUser[]; total: number }> => {
    const params: Record<string, unknown> = {};
    if (filters.tenantId) params.tenantId = filters.tenantId;
    if (filters.role) params.role = filters.role;
    // Sent only when actually set: omitting it means "any", and `false` is a
    // real filter value that must survive the trip.
    if (filters.isActive !== undefined) params.isActive = filters.isActive;
    if (filters.q) params.q = filters.q;
    if (filters.skip !== undefined) params.skip = filters.skip;
    if (filters.take !== undefined) params.take = filters.take;

    const response = await apiClient.get<{ items: PlatformUser[]; total: number }>(
      `/tenants/users`,
      { params }
    );
    return response.data;
  },

  /** Create a user inside a workspace, credentials included, from the console. */
  createPlatformUser: async (
    tenantId: string,
    input: CreatePlatformUserInput
  ): Promise<PlatformUser> => {
    const response = await apiClient.post<{ user: PlatformUser }>(
      `/tenants/${tenantId}/users`,
      input
    );
    return response.data.user;
  },

  /**
   * The values a NEWLY provisioned workspace starts with. Never touches an
   * existing tenant — see `bulkUpdateTenantSettings` for the separate action
   * that does.
   */
  getPlatformSettings: async (): Promise<PlatformSettings> => {
    const response = await apiClient.get<PlatformSettings>(`/platform-settings`);
    return response.data;
  },

  updatePlatformSettings: async (patch: WorkspaceSettingsFields): Promise<PlatformSettings> => {
    const response = await apiClient.put<PlatformSettings>(`/platform-settings`, patch);
    return response.data;
  },

  /**
   * Writes directly onto each selected tenant's OWN settings — the same effect
   * as that workspace's Business Owner making the change themselves, just done
   * to several at once. Returns how many rows actually matched, so a caller
   * can tell "applied" from "some of those workspaces no longer exist".
   */
  bulkUpdateTenantSettings: async (
    tenantIds: string[],
    settings: WorkspaceSettingsFields
  ): Promise<{ updatedCount: number }> => {
    const response = await apiClient.put<{ updatedCount: number }>(`/tenants/bulk-settings`, {
      tenantIds,
      settings,
    });
    return response.data;
  },
};
