import { IReportRepository, LowStockItem } from '../../domain/IReportRepository';

export interface LowStockReport {
  items: LowStockItem[];
  outOfStockCount: number;
  lowStockCount: number;
}

/**
 * The low-stock / unavailable list (§6.7).
 *
 * The Reports page previously showed only aggregate inventory value and item
 * counts — which tells an owner how much stock is worth but not which items
 * need reordering, the one thing the SRS actually names.
 *
 * The two counts are computed here rather than on the frontend so the summary
 * line and the table can never disagree about what "out of stock" means.
 */
export class GetLowStockReportUseCase {
  constructor(private readonly reportRepository: IReportRepository) {}

  async execute(tenantId: string): Promise<LowStockReport> {
    if (!tenantId) {
      throw new Error('Tenant ID is required');
    }

    const items = await this.reportRepository.getLowStockItems(tenantId);

    return {
      items,
      outOfStockCount: items.filter((i) => i.status === 'OUT_OF_STOCK').length,
      lowStockCount: items.filter((i) => i.status === 'LOW_STOCK').length,
    };
  }
}
