import { IProductRepository } from '../../domain/repositories';
import { Product } from '../../domain/Product';
import { UserRole } from '../../../auth/domain/enums/UserRole';

export interface UpdateProductDTO {
  tenantId: string;
  id: string;
  name?: string;
  description?: string;
  categoryId?: string | null;
  price?: number;
  lowStockThreshold?: number;
  authorRole: UserRole;
  authorWarehouseId?: string | null;
}

export class UpdateProductUseCase {
  constructor(private productRepo: IProductRepository) {}

  async execute(dto: UpdateProductDTO): Promise<Product> {
    if (dto.authorRole !== UserRole.BUSINESS_OWNER && dto.authorRole !== UserRole.STAFF && dto.authorRole !== UserRole.SUPER_ADMIN) {
      throw new Error('Unauthorized: Only Business Owners and Staff can update products.');
    }

    if (dto.authorRole === UserRole.STAFF && !dto.authorWarehouseId) {
      throw new Error('Unauthorized: You must be assigned to a warehouse to update products.');
    }

    const product = await this.productRepo.findById(dto.tenantId, dto.id);
    if (!product) {
      throw new Error(`Product ${dto.id} not found`);
    }

    product.update({
      name: dto.name,
      description: dto.description,
      categoryId: dto.categoryId,
      price: dto.price,
      lowStockThreshold: dto.lowStockThreshold
    });

    await this.productRepo.save(product);

    return product;
  }
}
