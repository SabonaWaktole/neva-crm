import { IProductRepository, ProductSearchFilters, ProductWithStock } from '../../domain/repositories';
import { UserRole } from '../../../auth/domain/enums/UserRole';

export interface SearchProductsDTO {
  tenantId: string;
  name?: string;
  categoryId?: string;
  warehouseId?: string;
  availability?: 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK';
  authorRole: UserRole;
}

export class SearchProductsUseCase {
  constructor(private productRepo: IProductRepository) {}

  async execute(dto: SearchProductsDTO): Promise<ProductWithStock[]> {
    if (dto.authorRole !== UserRole.BUSINESS_OWNER && dto.authorRole !== UserRole.STAFF) {
      throw new Error('Unauthorized: Only Business Owners and Staff can search products.');
    }

    const filters: ProductSearchFilters = {
      name: dto.name,
      categoryId: dto.categoryId,
      warehouseId: dto.warehouseId,
      availability: dto.availability,
    };

    return this.productRepo.search(dto.tenantId, filters);
  }
}
