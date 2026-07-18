import { OutcomeCategory } from '../entities/OutcomeCategory';

export interface IOutcomeCategoryRepository {
  findByTenantId(tenantId: string): Promise<OutcomeCategory[]>;
  findById(tenantId: string, id: string): Promise<OutcomeCategory | null>;
  save(tenantId: string, category: OutcomeCategory): Promise<void>;
}
