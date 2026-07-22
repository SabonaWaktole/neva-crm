import { IReportRepository, MonthlyRevenue } from '../../domain/IReportRepository';

export class GetRevenueReportUseCase {
  constructor(private readonly reportRepository: IReportRepository) {}

  async execute(tenantId: string, limitMonths: number = 12): Promise<MonthlyRevenue[]> {
    if (!tenantId) {
      throw new Error('Tenant ID is required');
    }
    
    if (limitMonths <= 0 || limitMonths > 60) {
      throw new Error('Limit months must be between 1 and 60');
    }

    return this.reportRepository.getMonthlyRevenue(tenantId, limitMonths);
  }
}
