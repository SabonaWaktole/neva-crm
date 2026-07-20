import { PrismaClient } from '@prisma/client';
import { IStockMovementRepository } from '../../domain/repositories';
import { StockMovement, StockMovementType } from '../../domain/StockMovement';

export class PrismaStockMovementRepository implements IStockMovementRepository {
  constructor(private prisma: PrismaClient) {}

  async save(movement: StockMovement): Promise<void> {
    await this.prisma.stockMovement.create({
      data: {
        id: movement.id,
        tenantId: movement.tenantId,
        productId: movement.productId,
        warehouseId: movement.warehouseId,
        fromWarehouseId: movement.fromWarehouseId,
        toWarehouseId: movement.toWarehouseId,
        quantity: movement.quantity,
        type: movement.type,
        reason: movement.reason,
        createdBy: movement.createdBy,
        createdAt: movement.createdAt,
      },
    });
  }
}
