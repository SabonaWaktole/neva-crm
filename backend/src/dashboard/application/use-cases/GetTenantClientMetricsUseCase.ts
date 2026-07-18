import { IClientRepository } from '../../../clients/domain/repositories/IClientRepository';
import { Client } from '../../../clients/domain/entities/Client';

export interface TenantClientMetrics {
  totalClients: number;
  activeClients: number;
  newClientsThisMonth: number;
  totalClientsLastWeek: number;
}

export class GetTenantClientMetricsUseCase {
  constructor(private clientRepository: IClientRepository) {}

  async execute(tenantId: string): Promise<TenantClientMetrics> {
    const totalClients = await this.clientRepository.countByTenant(tenantId);
    
    // In a real implementation we would likely add more specific count methods to the repository
    // e.g. countByTenantAndStatus(tenantId, 'ACTIVE')
    // and countByTenantAndDateRange(...)
    // For now, since the repository only has countByTenant, we will just return it for total
    // and fake the others to 0 until the repository is expanded, or we can fetch all and count in memory.
    
    // Fetching all to count them in memory since we don't have the repo methods yet.
    // In production, we'd add the repo methods.
    const result = await this.clientRepository.search(tenantId, {}, 0, 10000);
    const allClients = result.items;
    
    const activeClients = allClients.filter((c: Client) => c.status === 'ACTIVE').length;
    
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const newClientsThisMonth = allClients.filter((c: Client) => c.createdAt >= firstDayOfMonth).length;

    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(now.getDate() - 7);
    const totalClientsLastWeek = allClients.filter((c: Client) => c.createdAt < oneWeekAgo).length;

    return {
      totalClients,
      activeClients,
      newClientsThisMonth,
      totalClientsLastWeek,
    };
  }
}
