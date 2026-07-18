import { ICategoryRepository } from '../../domain/repositories';
import { Category } from '../../domain/Category';
import { UserRole } from '../../../auth/domain/enums/UserRole';

export interface UpdateCategoryDTO {
  tenantId: string;
  id: string;
  name?: string;
  authorRole: UserRole;
}

export class UpdateCategoryUseCase {
  constructor(private categoryRepo: ICategoryRepository) {}

  async execute(dto: UpdateCategoryDTO): Promise<Category> {
    if (dto.authorRole !== UserRole.BUSINESS_OWNER) {
      throw new Error('Unauthorized: Only Business Owners can manage categories.');
    }

    const category = await this.categoryRepo.findById(dto.tenantId, dto.id);
    if (!category) {
      throw new Error(`Category ${dto.id} not found`);
    }

    category.update({ name: dto.name });
    await this.categoryRepo.save(category);
    return category;
  }
}
