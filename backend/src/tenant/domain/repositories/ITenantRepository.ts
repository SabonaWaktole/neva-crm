import { Tenant } from '../entities/Tenant';

export interface ITenantRepository {
  findById(id: string): Promise<Tenant | null>;
  findBySlug(slug: string): Promise<Tenant | null>;
  create(tenant: Tenant): Promise<Tenant>;
}
