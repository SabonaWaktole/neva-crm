import { useState, useEffect, useCallback } from 'react';
import { reportService } from '../services/reportService';
import type { MonthlyRevenue, ClientStatusCount, WarehouseInventoryValue } from '../services/reportService';
import { useAuthStore } from '../store/useAuthStore';

export function useReports() {
  const [revenue, setRevenue] = useState<MonthlyRevenue[]>([]);
  const [clients, setClients] = useState<ClientStatusCount[]>([]);
  const [inventory, setInventory] = useState<WarehouseInventoryValue[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const tenantSlug = useAuthStore(state => state.user?.tenantSlug);

  const fetchReports = useCallback(async () => {
    if (!tenantSlug) return;
    
    try {
      setLoading(true);
      setError(null);

      const [revenueData, clientsData, inventoryData] = await Promise.all([
        reportService.getRevenue(tenantSlug),
        reportService.getClients(tenantSlug),
        reportService.getInventory(tenantSlug)
      ]);

      setRevenue(revenueData);
      setClients(clientsData);
      setInventory(inventoryData);
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Failed to fetch reports');
    } finally {
      setLoading(false);
    }
  }, [tenantSlug]);

  useEffect(() => {
    if (tenantSlug) {
      fetchReports();
    }
  }, [fetchReports, tenantSlug]);

  return {
    revenue,
    clients,
    inventory,
    loading,
    error,
    refresh: fetchReports
  };
}
