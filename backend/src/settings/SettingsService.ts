import { ITenantRepository } from '../tenant/domain/repositories/ITenantRepository';

export class SettingsService {
  constructor(private tenantRepository: ITenantRepository) {}

  async getRequiresQuotationApproval(tenantId: string): Promise<boolean> {
    const tenant = await this.tenantRepository.findById(tenantId);
    if (!tenant) return true; // Default to true if not found
    return tenant.requiresQuotationApproval;
  }
}
