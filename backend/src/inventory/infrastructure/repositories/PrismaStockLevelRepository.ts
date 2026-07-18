import { PrismaClient } from '@prisma/client';
import { IStockLevelRepository } from '../../domain/repositories';
import { StockLevel } from '../../domain/StockLevel';

export class PrismaStockLevelRepository implements IStockLevelRepository {
  constructor(private prisma: PrismaClient) {}

  async findById(tenantId: string, id: string): Promise<StockLevel | null> {
    const record = await this.prisma.stockLevel.findUnique({
      where: { id, tenantId },
    });
    if (!record) return null;
    return StockLevel.create({
      id: record.id,
      tenantId: record.tenantId,
      productId: record.productId,
      productTenantId: record.tenantId,
      warehouseId: record.warehouseId,
      warehouseTenantId: record.tenantId,
      quantity: record.quantity,
    });
  }

  async findByProductAndWarehouse(tenantId: string, productId: string, warehouseId: string): Promise<StockLevel | null> {
    const record = await this.prisma.stockLevel.findUnique({
      where: {
        tenantId_productId_warehouseId: {
          tenantId,
          productId,
          warehouseId,
        },
      },
    });
    if (!record) return null;
    return StockLevel.create({
      id: record.id,
      tenantId: record.tenantId,
      productId: record.productId,
      productTenantId: record.tenantId,
      warehouseId: record.warehouseId,
      warehouseTenantId: record.tenantId,
      quantity: record.quantity,
    });
  }

  async findByProductId(tenantId: string, productId: string): Promise<StockLevel[]> {
    const records = await this.prisma.stockLevel.findMany({
      where: { tenantId, productId },
      orderBy: { warehouseId: 'asc' }, // Ensure consistent ordering
    });
    return records.map(record => StockLevel.create({
      id: record.id,
      tenantId: record.tenantId,
      productId: record.productId,
      productTenantId: record.tenantId,
      warehouseId: record.warehouseId,
      warehouseTenantId: record.tenantId,
      quantity: record.quantity,
    }));
  }

  async save(stockLevel: StockLevel): Promise<void> {
    await this.prisma.stockLevel.upsert({
      where: { id: stockLevel.id },
      update: {
        quantity: stockLevel.quantity,
      },
      create: {
        id: stockLevel.id,
        tenantId: stockLevel.tenantId,
        productId: stockLevel.productId,
        productTenantId: stockLevel.tenantId,
        warehouseId: stockLevel.warehouseId,
        warehouseTenantId: stockLevel.tenantId,
        quantity: stockLevel.quantity,
      },
    });
  }

  async countByWarehouseId(tenantId: string, warehouseId: string): Promise<number> {
    return this.prisma.stockLevel.count({
      where: { tenantId, warehouseId },
    });
  }
}
