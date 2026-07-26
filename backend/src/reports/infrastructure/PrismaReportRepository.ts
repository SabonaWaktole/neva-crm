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
      /*
       * DELIBERATELY UTC — do not "fix" this to the tenant's timezone.
       *
       * A financial reporting period must have a boundary that is fixed once
       * the period exists. If months were bucketed in `tenant.timezone`, then
       * changing that setting would retroactively move revenue between months:
       * a quotation created at 23:30 UTC on 31 January would silently become
       * February revenue the moment someone moved the workspace east, and a
       * previously published figure would no longer reconcile.
       *
       * This is a permanent guarantee, not a shortcut taken for expedience.
       * The DAILY buckets on the dashboard DO follow the tenant zone (see
       * shared/domain/time/tenantDay.ts) because "appointments today" is a
       * question about the user's current day; "revenue in January" is a
       * question about a closed accounting period. The two differ on purpose.
       */
      const monthStr = q.createdAt.toISOString().slice(0, 7); // YYYY-MM, UTC
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
