import { IStockLevelRepository, IStockMovementRepository, IWarehouseRepository } from '../../domain/repositories';
import { StockMovement, StockMovementType } from '../../domain/StockMovement';
import { StockLevel } from '../../domain/StockLevel';
import { UserRole } from '../../../auth/domain/enums/UserRole';
import { randomUUID } from 'crypto';

export interface AdjustStockDTO {
  tenantId: string;
  productId: string;
  warehouseId: string;
  quantityChange: number; // positive = add, negative = remove
  reason: string;
  authorUserId: string;
  authorRole: UserRole;
}

export class AdjustStockUseCase {
  constructor(
    private stockLevelRepo: IStockLevelRepository,
    private stockMovementRepo: IStockMovementRepository,
    private warehouseRepo: IWarehouseRepository
  ) {}

  async execute(dto: AdjustStockDTO): Promise<{ stockLevel: StockLevel; movement: StockMovement }> {
    if (dto.authorRole !== UserRole.BUSINESS_OWNER && dto.authorRole !== UserRole.STAFF) {
      throw new Error('Unauthorized: Only Business Owners and Staff can adjust stock.');
    }

    let stockLevel = await this.stockLevelRepo.findByProductAndWarehouse(
      dto.tenantId, dto.productId, dto.warehouseId
    );

    if (!stockLevel) {
      // Validate warehouse belongs to this tenant before lazy creation
      const warehouse = await this.warehouseRepo.findById(dto.tenantId, dto.warehouseId);
      if (!warehouse) {
        throw new Error(`Warehouse ${dto.warehouseId} not found in tenant ${dto.tenantId}`);
      }
      stockLevel = StockLevel.create({
        id: randomUUID(),
        tenantId: dto.tenantId,
        productTenantId: dto.tenantId,
        warehouseTenantId: dto.tenantId,
        productId: dto.productId,
        warehouseId: dto.warehouseId,
        quantity: 0
      });
    }

    // This will throw NegativeStockError if the adjustment drops below zero
    stockLevel.adjustQuantity(dto.quantityChange);

    const movement = StockMovement.create({
      id: randomUUID(),
      tenantId: dto.tenantId,
      productId: dto.productId,
      warehouseId: dto.warehouseId,
      quantity: dto.quantityChange,
      type: StockMovementType.ADJUSTMENT,
      reason: dto.reason,
      createdBy: dto.authorUserId,
    });

    await this.stockLevelRepo.save(stockLevel);
    await this.stockMovementRepo.save(movement);

    return { stockLevel, movement };
  }
}
