import { ICategoryRepository } from '../../domain/repositories';
import { Category } from '../../domain/Category';
import { UserRole } from '../../../auth/domain/enums/UserRole';

export interface GetCategoriesRequest {
  tenantId: string;
  authorRole: UserRole;
}

export class GetCategoriesUseCase {
  constructor(private categoryRepository: ICategoryRepository) {}

  async execute(request: GetCategoriesRequest): Promise<Category[]> {
    if (request.authorRole !== UserRole.BUSINESS_OWNER && request.authorRole !== UserRole.STAFF) {
      throw new Error('Unauthorized: Only Business Owners and Staff can view categories.');
    }

    return this.categoryRepository.findAllByTenantId(request.tenantId);
  }
}
