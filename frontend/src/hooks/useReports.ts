import { useState, useEffect, useCallback } from 'react';
import { reportService } from '../services/reportService';
import type {
  MonthlyRevenue,
  ClientStatusCount,
  WarehouseInventoryValue,
  NewClientsPoint,
  AppointmentReport,
  LowStockReport,
} from '../services/reportService';
import { useAuthStore } from '../store/useAuthStore';

const EMPTY_APPOINTMENTS: AppointmentReport = { byStatus: [], byStaff: [], total: 0 };
const EMPTY_LOW_STOCK: LowStockReport = { items: [], outOfStockCount: 0, lowStockCount: 0 };

export function useReports() {
  const [revenue, setRevenue] = useState<MonthlyRevenue[]>([]);
  const [clients, setClients] = useState<ClientStatusCount[]>([]);
  const [inventory, setInventory] = useState<WarehouseInventoryValue[]>([]);
  const [clientTrend, setClientTrend] = useState<NewClientsPoint[]>([]);
  const [appointments, setAppointments] = useState<AppointmentReport>(EMPTY_APPOINTMENTS);
  const [lowStock, setLowStock] = useState<LowStockReport>(EMPTY_LOW_STOCK);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const tenantSlug = useAuthStore(state => state.user?.tenantSlug);

  const fetchReports = useCallback(async () => {
    if (!tenantSlug) return;

    try {
      setLoading(true);
      setError(null);

      /*
       * `allSettled`, not `all`.
       *
       * With six requests, `all` means one failing endpoint blanks the entire
       * page — an owner loses their revenue chart because the low-stock query
       * timed out. Each panel now renders whatever arrived, and the error
       * banner names only what actually failed.
       */
      const results = await Promise.allSettled([
        reportService.getRevenue(tenantSlug),
        reportService.getClients(tenantSlug),
        reportService.getInventory(tenantSlug),
        reportService.getClientTrend(tenantSlug),
        reportService.getAppointments(tenantSlug),
        reportService.getLowStock(tenantSlug),
      ]);

      const [revenueR, clientsR, inventoryR, trendR, appointmentsR, lowStockR] = results;

      if (revenueR.status === 'fulfilled') setRevenue(revenueR.value);
      if (clientsR.status === 'fulfilled') setClients(clientsR.value);
      if (inventoryR.status === 'fulfilled') setInventory(inventoryR.value);
      if (trendR.status === 'fulfilled') setClientTrend(trendR.value);
      if (appointmentsR.status === 'fulfilled') setAppointments(appointmentsR.value);
      if (lowStockR.status === 'fulfilled') setLowStock(lowStockR.value);

      const firstFailure = results.find((r) => r.status === 'rejected') as
        | PromiseRejectedResult
        | undefined;
      if (firstFailure) {
        const err = firstFailure.reason;
        setError(err?.response?.data?.error || err?.message || 'Some reports failed to load');
      }
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
    clientTrend,
    appointments,
    lowStock,
    loading,
    error,
    refresh: fetchReports
  };
}
