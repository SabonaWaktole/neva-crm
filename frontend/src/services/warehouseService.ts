import { apiClient } from '../api';
import type { Warehouse } from '../types/inventory';

export const warehouseService = {
  getWarehouses: async (tenantSlug: string): Promise<Warehouse[]> => {
    const response = await apiClient.get(`/${tenantSlug}/inventory/warehouses`);
    return response.data;
  },

  createWarehouse: async (tenantSlug: string, data: { name: string; address?: string }): Promise<Warehouse> => {
    const response = await apiClient.post(`/${tenantSlug}/inventory/warehouses`, data);
    return response.data;
  },

  updateWarehouse: async (tenantSlug: string, warehouseId: string, data: { name?: string; address?: string }): Promise<Warehouse> => {
    const response = await apiClient.put(`/${tenantSlug}/inventory/warehouses/${warehouseId}`, data);
    return response.data;
  },

  deleteWarehouse: async (tenantSlug: string, warehouseId: string): Promise<void> => {
    await apiClient.delete(`/${tenantSlug}/inventory/warehouses/${warehouseId}`);
  }
};
