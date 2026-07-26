import { IClientRepository } from '../../../clients/domain/repositories/IClientRepository';
import { Client } from '../../../clients/domain/entities/Client';
import { prisma } from '../../../shared/infrastructure/prisma/client';

export interface TenantClientMetrics {
  totalClients: number;
  totalClientsLastWeek: number;
  /** Appointments scheduled for today, excluding cancelled ones. */
  appointmentsToday: number;
  /** Same window yesterday, so the card can show a real day-over-day delta. */
  appointmentsYesterday: number;
  /** Quotations still in flight — neither accepted, rejected nor expired. */
  openQuotations: number;
  /** Of those, the ones sitting in PENDING_APPROVAL and waiting on someone. */
  quotationsAwaitingApproval: number;
  /** Products at or below their low-stock threshold across all warehouses. */
  lowStockProducts: number;
  /** Of those, the ones that are completely out of stock. */
  outOfStockProducts: number;
}

/**
 * Quotations that still need someone to act on them. ACCEPTED / REJECTED /
 * EXPIRED are terminal, so they are excluded.
 */
const OPEN_QUOTATION_STATUSES = ['DRAFT', 'PENDING_APPROVAL', 'SENT'];

/** A cancelled appointment is not something the day's count should include. */
const ACTIVE_APPOINTMENT_STATUSES = ['SCHEDULED', 'CONFIRMED', 'COMPLETED'];

/** Local midnight `offset` days from today, and midnight the day after. */
const dayBounds = (offset: number): { start: Date; end: Date } => {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() + offset);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return { start, end };
};

export class GetTenantClientMetricsUseCase {
  constructor(private clientRepository: IClientRepository) {}

  async execute(tenantId: string): Promise<TenantClientMetrics> {
    const totalClients = await this.clientRepository.countByTenant(tenantId);

    // In production we would add countByTenantAndDateRange to the repository.
    // For now, we fetch all to count in memory.
    const result = await this.clientRepository.search(tenantId, {}, 0, 10000);
    const allClients = result.items;

    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const totalClientsLastWeek = allClients.filter((c: Client) => c.createdAt < oneWeekAgo).length;

    const today = dayBounds(0);
    const yesterday = dayBounds(-1);

    // Counted directly through Prisma rather than via repositories: these are
    // read-only aggregates for a dashboard, and adding count methods to three
    // separate domain repositories would be a lot of plumbing for numbers that
    // never re-enter the domain. Every query is scoped by tenantId.
    const [
      appointmentsToday,
      appointmentsYesterday,
      openQuotations,
      quotationsAwaitingApproval,
      stockByProduct,
      products,
    ] = await Promise.all([
      prisma.appointment.count({
        where: {
          tenantId,
          status: { in: ACTIVE_APPOINTMENT_STATUSES },
          scheduledAt: { gte: today.start, lt: today.end },
        },
      }),
      prisma.appointment.count({
        where: {
          tenantId,
          status: { in: ACTIVE_APPOINTMENT_STATUSES },
          scheduledAt: { gte: yesterday.start, lt: yesterday.end },
        },
      }),
      prisma.quotation.count({
        where: { tenantId, status: { in: OPEN_QUOTATION_STATUSES } },
      }),
      prisma.quotation.count({
        where: { tenantId, status: 'PENDING_APPROVAL' },
      }),
      // Stock lives per warehouse, but "low stock" is a property of the
      // product as a whole, so totals are summed across warehouses first.
      prisma.stockLevel.groupBy({
        by: ['productId'],
        where: { tenantId },
        _sum: { quantity: true },
      }),
      prisma.product.findMany({
        where: { tenantId },
        select: { id: true, lowStockThreshold: true },
      }),
    ]);

    const quantityByProduct = new Map(
      stockByProduct.map((row: any) => [row.productId, row._sum?.quantity ?? 0])
    );

    let lowStockProducts = 0;
    let outOfStockProducts = 0;
    for (const product of products) {
      // A product with no StockLevel rows at all has never been stocked
      // anywhere, which counts as out of stock rather than as "unknown".
      const quantity = Number(quantityByProduct.get(product.id) ?? 0);
      if (quantity <= 0) {
        outOfStockProducts += 1;
        lowStockProducts += 1;
      } else if (quantity <= product.lowStockThreshold) {
        lowStockProducts += 1;
      }
    }

    return {
      totalClients,
      totalClientsLastWeek,
      appointmentsToday,
      appointmentsYesterday,
      openQuotations,
      quotationsAwaitingApproval,
      lowStockProducts,
      outOfStockProducts,
    };
  }
}
