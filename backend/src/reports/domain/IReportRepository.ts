export interface MonthlyRevenue {
  month: string; // e.g., '2026-07'
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

export interface IReportRepository {
  getMonthlyRevenue(tenantId: string, limitMonths?: number): Promise<MonthlyRevenue[]>;
  getClientStatusDistribution(tenantId: string): Promise<ClientStatusCount[]>;
  getInventoryValueByWarehouse(tenantId: string): Promise<WarehouseInventoryValue[]>;
}
