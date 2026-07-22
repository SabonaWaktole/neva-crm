import { Integration } from '../entities/Integration';

export interface IIntegrationRepository {
  findByTenantId(tenantId: string): Promise<Integration[]>;
  findByProvider(tenantId: string, provider: string): Promise<Integration | null>;
  save(integration: Integration): Promise<void>;
}
