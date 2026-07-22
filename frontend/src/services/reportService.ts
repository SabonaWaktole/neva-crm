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
  }
};
