import { ICategoryRepository } from '../../domain/repositories';
import { UserRole } from '../../../auth/domain/enums/UserRole';

export interface ArchiveUnusedCategoriesRequest {
  tenantId: string;
  authorRole: UserRole;
  limit?: number;
}

export class ArchiveUnusedCategoriesUseCase {
  constructor(private categoryRepository: ICategoryRepository) {}

  async execute(request: ArchiveUnusedCategoriesRequest): Promise<{ count: number }> {
    if (request.authorRole !== UserRole.BUSINESS_OWNER) {
      throw new Error('Unauthorized: Only Business Owners can archive categories.');
    }

    const limit = request.limit ?? 3;
    const categoriesToArchive = await this.categoryRepository.findLeastRecentlyUsedCategories(request.tenantId, limit);

    for (const category of categoriesToArchive) {
      category.update({ isArchived: true });
      await this.categoryRepository.update(category);
    }

    return { count: categoriesToArchive.length };
  }
}
