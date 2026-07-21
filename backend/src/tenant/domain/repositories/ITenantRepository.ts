import { Tenant } from '../entities/Tenant';

export interface ITenantRepository {
  findById(id: string): Promise<Tenant | null>;
  findBySlug(slug: string): Promise<Tenant | null>;
  create(tenant: Tenant): Promise<Tenant>;
  findAll(skip: number, take: number): Promise<{ items: Tenant[]; total: number }>;
  updateSettings(id: string, settings: { requiresQuotationApproval: boolean }): Promise<void>;
}
