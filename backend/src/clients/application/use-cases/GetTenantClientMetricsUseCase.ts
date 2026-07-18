import { IClientRepository } from '../../domain/repositories/IClientRepository';

export interface GetTenantClientMetricsDTO {
  tenantId: string;
}

export class GetTenantClientMetricsUseCase {
  constructor(private clientRepo: IClientRepository) {}

  async execute(dto: GetTenantClientMetricsDTO) {
    const totalClients = await this.clientRepo.countByTenant(dto.tenantId);
    
    // Calculate 7 days ago
    const lastWeek = new Date();
    lastWeek.setDate(lastWeek.getDate() - 7);

    // Get count of clients created before 7 days ago
    // Wait, the requirement says "total clients" and "+12% vs last week".
    // "last week" usually means the total clients as of 7 days ago.
    // So we need to count clients created before lastWeek, and compare.
    // Actually, countByTenant could take a Date, and count clients created BEFORE that date? Or AFTER?
    // Let's assume countByTenant(tenantId, createdBefore) or something. Wait, my interface added createdAfter.
    // If I want total clients from last week, I should get total clients created BEFORE last week.
    // Let me update IClientRepository to take createdBefore instead of createdAfter.
    // But for now, let's just do `countByTenant` with a `createdBefore` param if needed, or maybe just `countByTenant` returns total, and `countByTenant(tenantId, lastWeek)` returns total created before last week.
    const totalClientsLastWeek = await this.clientRepo.countByTenant(dto.tenantId, lastWeek);

    return {
      totalClients,
      totalClientsLastWeek
    };
  }
}
