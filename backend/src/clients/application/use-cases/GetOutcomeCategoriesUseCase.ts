import { IOutcomeCategoryRepository } from '../../domain/repositories/IOutcomeCategoryRepository';
import { OutcomeCategory } from '../../domain/entities/OutcomeCategory';

export class GetOutcomeCategoriesUseCase {
  constructor(private outcomeCategoryRepo: IOutcomeCategoryRepository) {}

  async execute(tenantId: string): Promise<OutcomeCategory[]> {
    return this.outcomeCategoryRepo.findByTenantId(tenantId);
  }
}
