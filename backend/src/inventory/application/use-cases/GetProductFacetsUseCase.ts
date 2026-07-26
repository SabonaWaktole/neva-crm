import { IProductRepository } from '../../domain/repositories';
import { UserRole } from '../../../auth/domain/enums/UserRole';

export interface GetProductFacetsDTO {
  tenantId: string;
  authorRole: UserRole;
}

export interface ProductFacets {
  brands: string[];
  tags: string[];
}

/**
 * The distinct brands and tags in a tenant's catalogue, used to populate the
 * list's filter dropdowns and the tag input's suggestions.
 */
export class GetProductFacetsUseCase {
  constructor(private productRepo: IProductRepository) {}

  async execute(dto: GetProductFacetsDTO): Promise<ProductFacets> {
    if (dto.authorRole !== UserRole.BUSINESS_OWNER && dto.authorRole !== UserRole.STAFF) {
      throw new Error('Unauthorized: Only Business Owners and Staff can view the catalogue.');
    }

    const [brands, tags] = await Promise.all([
      this.productRepo.listBrands(dto.tenantId),
      this.productRepo.listTags(dto.tenantId),
    ]);

    return { brands, tags };
  }
}
