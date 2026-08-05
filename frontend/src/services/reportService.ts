import { apiClient } from '../api';

export interface MonthlyRevenue {
  month: string;
  revenue: number;
}

export interface ClientStatusCount {
  status: string;
  count: number;
}

export interface WarehouseInventoryValue {
  warehouseName: string;
  totalItems: number;
  totalValue: number;
}

/** §6.7 new-client trend. One bucket per month, gaps filled server-side. */
export interface NewClientsPoint {
  month: string;
  count: number;
}

export interface AppointmentStatusCount {
  status: string;
  count: number;
}

export interface AppointmentsByStaff {
  userId: string;
  staffName: string;
  scheduled: number;
  confirmed: number;
  completed: number;
  cancelled: number;
  total: number;
}

export interface AppointmentReport {
  byStatus: AppointmentStatusCount[];
  byStaff: AppointmentsByStaff[];
  total: number;
}

/** One product short at one warehouse — the SRS wants shortages located. */
export interface LowStockItem {
  productId: string;
  productName: string;
  sku: string | null;
  warehouseId: string;
  warehouseName: string;
  quantity: number;
  threshold: number;
  status: 'OUT_OF_STOCK' | 'LOW_STOCK';
}

export interface LowStockReport {
  items: LowStockItem[];
  outOfStockCount: number;
  lowStockCount: number;
}

export interface AppointmentReportFilters {
  from?: string;
  to?: string;
  assignedUserId?: string;
}

export const reportService = {
  getRevenue: async (tenantSlug: string, limit?: number): Promise<MonthlyRevenue[]> => {
    const url = limit ? `/${tenantSlug}/reports/revenue?limit=${limit}` : `/${tenantSlug}/reports/revenue`;
    const response = await apiClient.get<{ revenue: MonthlyRevenue[] }>(url);
    return response.data.revenue;
  },

  getClients: async (tenantSlug: string): Promise<ClientStatusCount[]> => {
    const response = await apiClient.get<{ clients: ClientStatusCount[] }>(`/${tenantSlug}/reports/clients`);
    return response.data.clients;
  },

  getInventory: async (tenantSlug: string): Promise<WarehouseInventoryValue[]> => {
    const response = await apiClient.get<{ inventory: WarehouseInventoryValue[] }>(`/${tenantSlug}/reports/inventory`);
    return response.data.inventory;
  },

  getClientTrend: async (tenantSlug: string, months = 12): Promise<NewClientsPoint[]> => {
    const response = await apiClient.get<{ trend: NewClientsPoint[] }>(
      `/${tenantSlug}/reports/clients/trend?months=${months}`
    );
    return response.data.trend;
  },

  getAppointments: async (
    tenantSlug: string,
    filters: AppointmentReportFilters = {}
  ): Promise<AppointmentReport> => {
    // URLSearchParams rather than template concatenation: `assignedUserId` is a
    // UUID today but the date filters come from user input, and one unencoded
    // value is all it takes to silently drop a filter.
    const params = new URLSearchParams();
    if (filters.from) params.set('from', filters.from);
    if (filters.to) params.set('to', filters.to);
    if (filters.assignedUserId) params.set('assignedUserId', filters.assignedUserId);

    const query = params.toString();
    const response = await apiClient.get<AppointmentReport>(
      `/${tenantSlug}/reports/appointments${query ? `?${query}` : ''}`
    );
    return response.data;
  },

  getLowStock: async (tenantSlug: string): Promise<LowStockReport> => {
    const response = await apiClient.get<LowStockReport>(
      `/${tenantSlug}/reports/inventory/low-stock`
    );
    return response.data;
  },

  /**
   * POST rather than GET: the body carries the chart PNGs captured
   * client-side (see ReportsPage's `captureChartAsPng`), which can run to
   * hundreds of KB — well past what belongs in a query string.
   */
  exportPdf: async (
    tenantSlug: string,
    payload: {
      tenantName: string;
      byStaff: AppointmentsByStaff[];
      lowStock: LowStockItem[];
      charts: Record<string, string>;
    }
  ): Promise<Blob> => {
    const response = await apiClient.post(`/${tenantSlug}/reports/export/pdf`, payload, {
      responseType: 'blob'
    });
    return response.data;
  }
};
