import { ICategoryRepository, IProductRepository } from '../../domain/repositories';
import { UserRole } from '../../../auth/domain/enums/UserRole';
import { CategoryInUseError } from '../../domain/inUseErrors';

export interface DeleteCategoryDTO {
  tenantId: string;
  id: string;
  authorRole: UserRole;
}

export class DeleteCategoryUseCase {
  constructor(
    private categoryRepo: ICategoryRepository,
    private productRepo: IProductRepository
  ) {}

  async execute(dto: DeleteCategoryDTO): Promise<void> {
    if (dto.authorRole !== UserRole.BUSINESS_OWNER) {
      throw new Error('Unauthorized: Only Business Owners can manage categories.');
    }

    const category = await this.categoryRepo.findById(dto.tenantId, dto.id);
    if (!category) {
      throw new Error(`Category ${dto.id} not found`);
    }

    // Block deletion if any product uses this category
    const productCount = await this.productRepo.countByCategoryId(dto.tenantId, dto.id);
    if (productCount > 0) {
      throw new CategoryInUseError(dto.id);
    }

    await this.categoryRepo.delete(dto.tenantId, dto.id);
  }
}
