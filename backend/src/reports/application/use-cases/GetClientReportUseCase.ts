import { IReportRepository, ClientStatusCount } from '../../domain/IReportRepository';

export class GetClientReportUseCase {
  constructor(private readonly reportRepository: IReportRepository) {}

  async execute(tenantId: string): Promise<ClientStatusCount[]> {
    if (!tenantId) {
      throw new Error('Tenant ID is required');
    }

    return this.reportRepository.getClientStatusDistribution(tenantId);
  }
}
