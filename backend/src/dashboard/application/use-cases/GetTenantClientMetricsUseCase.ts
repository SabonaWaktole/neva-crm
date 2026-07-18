import { IClientRepository } from '../../../clients/domain/repositories/IClientRepository';
import { Client } from '../../../clients/domain/entities/Client';

export interface TenantClientMetrics {
  totalClients: number;
  totalClientsLastWeek: number;
}

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

    return {
      totalClients,
      totalClientsLastWeek,
    };
  }
}
