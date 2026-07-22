import { PrismaClient } from '@prisma/client';
import { IReportRepository, MonthlyRevenue, ClientStatusCount, WarehouseInventoryValue } from '../domain/IReportRepository';

export class PrismaReportRepository implements IReportRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async getMonthlyRevenue(tenantId: string, limitMonths: number = 12): Promise<MonthlyRevenue[]> {
    const d = new Date();
    d.setMonth(d.getMonth() - limitMonths);

    // Prisma doesn't have a direct "group by month" function for sum that works across all DBs easily, 
    // so we can either use raw SQL or pull the recent quotations and aggregate in memory.
    // For simplicity and DB agnosticism, we will fetch and aggregate in memory.
    const quotations = await this.prisma.quotation.findMany({
      where: {
        tenantId,
        status: { in: ['ACCEPTED', 'WON'] },
        createdAt: { gte: d }
      },
      include: {
        lineItems: true
      }
    });

    const monthlyMap: Record<string, number> = {};

    for (const q of quotations) {
      const monthStr = q.createdAt.toISOString().slice(0, 7); // YYYY-MM
      if (!monthlyMap[monthStr]) {
        monthlyMap[monthStr] = 0;
      }
      
      const totalValue = q.lineItems.reduce((acc, item) => acc + (item.quantity * item.unitPrice), 0);
      monthlyMap[monthStr] += totalValue;
    }

    // Convert map to array and sort
    const result: MonthlyRevenue[] = Object.entries(monthlyMap)
      .map(([month, revenue]) => ({ month, revenue }))
      .sort((a, b) => a.month.localeCompare(b.month));

    return result;
  }

  async getClientStatusDistribution(tenantId: string): Promise<ClientStatusCount[]> {
    const counts = await this.prisma.client.groupBy({
      by: ['status'],
      where: { tenantId },
      _count: {
        id: true
      }
    });

    return counts.map(c => ({
      status: c.status,
      count: c._count.id
    }));
  }

  async getInventoryValueByWarehouse(tenantId: string): Promise<WarehouseInventoryValue[]> {
    const warehouses = await this.prisma.warehouse.findMany({
      where: { tenantId },
      include: {
        stockLevels: {
          include: {
            product: true
          }
        }
      }
    });

    return warehouses.map(w => {
      let totalItems = 0;
      let totalValue = 0;

      for (const stock of w.stockLevels) {
        totalItems += stock.quantity;
        totalValue += stock.quantity * stock.product.price;
      }

      return {
        warehouseName: w.name,
        totalItems,
        totalValue
      };
    });
  }
}
