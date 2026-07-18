import { IProductRepository, IStockLevelRepository } from '../../domain/repositories';
import { StockLevel } from '../../domain/StockLevel';
import { Product } from '../../domain/Product';
import { UserRole } from '../../../auth/domain/enums/UserRole';

export interface GetProductStockBreakdownDTO {
  tenantId: string;
  productId: string;
  authorRole: UserRole;
}

export class GetProductStockBreakdownUseCase {
  constructor(
    private productRepo: IProductRepository,
    private stockLevelRepo: IStockLevelRepository
  ) {}

  async execute(dto: GetProductStockBreakdownDTO): Promise<{ product: Product; stockLevels: StockLevel[] }> {
    if (dto.authorRole !== UserRole.BUSINESS_OWNER && dto.authorRole !== UserRole.STAFF) {
      throw new Error('Unauthorized: Only Business Owners and Staff can view product stock.');
    }

    const product = await this.productRepo.findById(dto.tenantId, dto.productId);
    if (!product) {
      throw new Error(`Product ${dto.productId} not found`);
    }

    const stockLevels = await this.stockLevelRepo.findByProductId(dto.tenantId, dto.productId);

    return { product, stockLevels };
  }
}
