import { IProductRepository, ProductSearchFilters, ProductWithStock } from '../../domain/repositories';
import { UserRole } from '../../../auth/domain/enums/UserRole';

export interface SearchProductsDTO {
  tenantId: string;
  name?: string;
  categoryId?: string;
  warehouseId?: string;
  availability?: 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK';
  authorRole: UserRole;
  authorWarehouseId?: string | null;
}

export class SearchProductsUseCase {
  constructor(private productRepo: IProductRepository) {}

  async execute(dto: SearchProductsDTO): Promise<ProductWithStock[]> {
    if (dto.authorRole !== UserRole.BUSINESS_OWNER && dto.authorRole !== UserRole.STAFF && dto.authorRole !== UserRole.SUPER_ADMIN) {
      throw new Error('Unauthorized: Only Business Owners and Staff can search products.');
    }

    if (dto.authorRole === UserRole.STAFF && !dto.authorWarehouseId) {
      throw new Error('Unauthorized: You must be assigned to a warehouse to view products.');
    }

    let filterWarehouseId = dto.warehouseId;
    if (dto.authorRole === UserRole.STAFF) {
      // Force the filter to the staff's assigned warehouse
      filterWarehouseId = dto.authorWarehouseId as string;
    }

    const filters: ProductSearchFilters = {
      name: dto.name,
      categoryId: dto.categoryId,
      warehouseId: filterWarehouseId,
      availability: dto.availability,
    };

    return this.productRepo.search(dto.tenantId, filters);
  }
}
