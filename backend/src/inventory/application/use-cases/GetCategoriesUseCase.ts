import { ICategoryRepository, CategoryWithItemCount } from '../../domain/repositories';
import { UserRole } from '../../../auth/domain/enums/UserRole';

export interface GetCategoriesRequest {
  tenantId: string;
  authorRole: UserRole;
  includeArchived?: boolean;
}

export class GetCategoriesUseCase {
  constructor(private categoryRepository: ICategoryRepository) {}

  async execute(request: GetCategoriesRequest): Promise<CategoryWithItemCount[]> {
    if (request.authorRole !== UserRole.BUSINESS_OWNER && request.authorRole !== UserRole.STAFF) {
      throw new Error('Unauthorized: Only Business Owners and Staff can view categories.');
    }

    return this.categoryRepository.findAllWithItemCount(request.tenantId, request.includeArchived);
  }
}
