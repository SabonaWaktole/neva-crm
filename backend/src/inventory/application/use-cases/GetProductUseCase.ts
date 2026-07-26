import { IProductRepository, ProductWithStock } from '../../domain/repositories';
import { UserRole } from '../../../auth/domain/enums/UserRole';

export interface GetProductDTO {
  tenantId: string;
  id: string;
  authorRole: UserRole;
  authorWarehouseId?: string | null;
}

/**
 * Loads one product with its stock, images and derived status — everything the
 * edit form needs in a single round trip.
 */
export class GetProductUseCase {
  constructor(private productRepo: IProductRepository) {}

  async execute(dto: GetProductDTO): Promise<ProductWithStock> {
    if (dto.authorRole !== UserRole.BUSINESS_OWNER && dto.authorRole !== UserRole.STAFF) {
      throw new Error('Unauthorized: Only Business Owners and Staff can view products.');
    }

    const product = await this.productRepo.findWithStock(dto.tenantId, dto.id);
    if (!product) {
      throw new Error(`Product ${dto.id} not found`);
    }

    return product;
  }
}
