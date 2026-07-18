import { ICategoryRepository } from '../../domain/repositories';
import { Category } from '../../domain/Category';
import { UserRole } from '../../../auth/domain/enums/UserRole';
import { randomUUID } from 'crypto';

export interface CreateCategoryDTO {
  tenantId: string;
  name: string;
  authorRole: UserRole;
}

export class CreateCategoryUseCase {
  constructor(private categoryRepo: ICategoryRepository) {}

  async execute(dto: CreateCategoryDTO): Promise<Category> {
    if (dto.authorRole !== UserRole.BUSINESS_OWNER) {
      throw new Error('Unauthorized: Only Business Owners can manage categories.');
    }

    const category = Category.create({
      id: randomUUID(),
      tenantId: dto.tenantId,
      name: dto.name,
    });

    await this.categoryRepo.save(category);
    return category;
  }
}
