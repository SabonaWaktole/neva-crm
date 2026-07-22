import { IStockLevelRepository, IStockMovementRepository, IStockTransactionManager } from '../../domain/repositories';
import { StockMovement, StockMovementType } from '../../domain/StockMovement';
import { StockLevel } from '../../domain/StockLevel';
import { UserRole } from '../../../auth/domain/enums/UserRole';
import { randomUUID } from 'crypto';

export interface TransferStockDTO {
  tenantId: string;
  productId: string;
  fromWarehouseId: string;
  toWarehouseId: string;
  quantity: number; // Always positive — represents the amount being moved
  reason?: string;
  authorUserId: string;
  authorRole: UserRole;
  authorWarehouseId?: string | null;
}

export class TransferStockUseCase {
  constructor(
    private stockLevelRepo: IStockLevelRepository,
    private transactionManager: IStockTransactionManager
  ) {}

  async execute(dto: TransferStockDTO): Promise<{ sourceStock: StockLevel; destStock: StockLevel; movement: StockMovement }> {
    if (dto.authorRole !== UserRole.BUSINESS_OWNER && dto.authorRole !== UserRole.STAFF) {
      throw new Error('Unauthorized: Only Business Owners and Staff can transfer stock.');
    }

    if (dto.authorRole === UserRole.STAFF && dto.authorWarehouseId !== dto.fromWarehouseId) {
      throw new Error('Unauthorized: You can only transfer stock out of your assigned warehouse.');
    }

    if (dto.quantity <= 0) {
      throw new Error('Transfer quantity must be positive.');
    }

    // Load stock levels OUTSIDE the transaction to validate early
    const sourceStock = await this.stockLevelRepo.findByProductAndWarehouse(
      dto.tenantId, dto.productId, dto.fromWarehouseId
    );
    if (!sourceStock) {
      throw new Error(`Stock level not found for product ${dto.productId} at source warehouse ${dto.fromWarehouseId}`);
    }

    const destStock = await this.stockLevelRepo.findByProductAndWarehouse(
      dto.tenantId, dto.productId, dto.toWarehouseId
    );
    if (!destStock) {
      throw new Error(`Stock level not found for product ${dto.productId} at destination warehouse ${dto.toWarehouseId}`);
    }

    // Domain-level validation: throws NegativeStockError if insufficient
    sourceStock.adjustQuantity(-dto.quantity);
    destStock.adjustQuantity(dto.quantity);

    const movement = StockMovement.create({
      id: randomUUID(),
      tenantId: dto.tenantId,
      productId: dto.productId,
      fromWarehouseId: dto.fromWarehouseId,
      toWarehouseId: dto.toWarehouseId,
      quantity: dto.quantity,
      type: StockMovementType.TRANSFER,
      reason: dto.reason,
      createdBy: dto.authorUserId,
    });

    // All persistence happens inside the transaction manager
    await this.transactionManager.executeTransaction(async ({ stockLevelRepository, stockMovementRepository }) => {
      await stockLevelRepository.save(sourceStock);
      await stockLevelRepository.save(destStock);
      await stockMovementRepository.save(movement);
    });

    return { sourceStock, destStock, movement };
  }
}
