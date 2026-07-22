import { IProductRepository, IWarehouseRepository, IStockTransactionManager } from '../../domain/repositories';
import { Product } from '../../domain/Product';
import { StockLevel } from '../../domain/StockLevel';
import { randomUUID } from 'crypto';
import { CrossTenantIsolationError } from '../../domain/errors';

import { UserRole } from '../../../auth/domain/enums/UserRole';

export interface InitialStock {
  warehouseId: string;
  quantity: number;
}

export interface CreateProductDTO {
  tenantId: string;
  name: string;
  description: string;
  categoryId: string | null;
  price: number;
  lowStockThreshold?: number;
  initialStock: InitialStock[];
  authorRole: UserRole;
  authorWarehouseId?: string | null;
}

export class CreateProductUseCase {
  constructor(
    private productRepo: IProductRepository,
    private warehouseRepo: IWarehouseRepository,
    private transactionManager: IStockTransactionManager
  ) {}

  async execute(dto: CreateProductDTO): Promise<{ product: Product; stockLevels: StockLevel[] }> {
    if (dto.authorRole !== UserRole.BUSINESS_OWNER && dto.authorRole !== UserRole.STAFF && dto.authorRole !== UserRole.SUPER_ADMIN) {
      throw new Error('Unauthorized: Only Business Owners and Staff can create products.');
    }

    if (dto.authorRole === UserRole.STAFF && !dto.authorWarehouseId) {
      throw new Error('Unauthorized: You must be assigned to a warehouse to create products.');
    }

    // 1. Verify warehouses belong to the same tenant and staff permissions
    const stockLevels: StockLevel[] = [];
    const productId = randomUUID();

    for (const stock of dto.initialStock) {
      if (dto.authorRole === UserRole.STAFF && dto.authorWarehouseId !== stock.warehouseId) {
        throw new Error('Unauthorized: You can only add initial stock to your assigned warehouse.');
      }

      const warehouse = await this.warehouseRepo.findById(dto.tenantId, stock.warehouseId);
      if (!warehouse) {
        throw new Error(`Warehouse ${stock.warehouseId} not found`);
      }
      if (warehouse.tenantId !== dto.tenantId) {
        throw new CrossTenantIsolationError(`Warehouse ${stock.warehouseId} belongs to a different tenant.`);
      }

      stockLevels.push(StockLevel.create({
        id: randomUUID(),
        tenantId: dto.tenantId,
        productId: productId,
        productTenantId: dto.tenantId,
        warehouseId: warehouse.id,
        warehouseTenantId: warehouse.tenantId,
        quantity: stock.quantity
      }));
    }

    // 2. Create the Product
    const product = Product.create({
      id: productId,
      tenantId: dto.tenantId,
      name: dto.name,
      description: dto.description,
      categoryId: dto.categoryId,
      price: dto.price,
      lowStockThreshold: dto.lowStockThreshold
    });

    // 3. Save atomically
    await this.transactionManager.executeTransaction(async ({ stockLevelRepository }) => {
      await this.productRepo.save(product);
      for (const stockLevel of stockLevels) {
        await stockLevelRepository.save(stockLevel);
      }
    });

    return { product, stockLevels };
  }
}
