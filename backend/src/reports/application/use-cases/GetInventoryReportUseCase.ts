import { IReportRepository, WarehouseInventoryValue } from '../../domain/IReportRepository';

export class GetInventoryReportUseCase {
  constructor(private readonly reportRepository: IReportRepository) {}

  async execute(tenantId: string): Promise<WarehouseInventoryValue[]> {
    if (!tenantId) {
      throw new Error('Tenant ID is required');
    }

    return this.reportRepository.getInventoryValueByWarehouse(tenantId);
  }
}
