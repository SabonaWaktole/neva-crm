import {
  IProductRepository,
  ProductSearchFilters,
  ProductSearchResult,
  ProductSortField,
  ProductStatus,
  ProductSummary,
  SortDirection,
} from '../../domain/repositories';
import { UserRole } from '../../../auth/domain/enums/UserRole';

export interface SearchProductsDTO {
  tenantId: string;
  name?: string;
  categoryId?: string;
  warehouseId?: string;
  brand?: string;
  tags?: string[];
  availability?: 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK';
  status?: ProductStatus;
  includeArchived?: boolean;
  sortBy?: ProductSortField;
  sortDirection?: SortDirection;
  page?: number;
  pageSize?: number;
  authorRole: UserRole;
  authorWarehouseId?: string | null;
}

/** The list response: a page of products plus the totals the KPI strip shows. */
export interface SearchProductsResponse extends ProductSearchResult {
  summary: ProductSummary;
}

export class SearchProductsUseCase {
  constructor(private productRepo: IProductRepository) {}

  async execute(dto: SearchProductsDTO): Promise<SearchProductsResponse> {
    if (dto.authorRole !== UserRole.BUSINESS_OWNER && dto.authorRole !== UserRole.STAFF) {
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
      brand: dto.brand,
      tags: dto.tags,
      availability: dto.availability,
      status: dto.status,
      includeArchived: dto.includeArchived,
      sortBy: dto.sortBy,
      sortDirection: dto.sortDirection,
      page: dto.page,
      pageSize: dto.pageSize,
    };

    // The summary describes the whole filtered set, so it comes from the same
    // filters minus pagination rather than from the page being returned.
    const [result, summary] = await Promise.all([
      this.productRepo.search(dto.tenantId, filters),
      this.productRepo.summarise(dto.tenantId, filters),
    ]);

    return { ...result, summary };
  }
}
