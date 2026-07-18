import { PrismaClient } from '@prisma/client';
import { IWarehouseRepository } from '../../domain/repositories';
import { Warehouse } from '../../domain/Warehouse';

export class PrismaWarehouseRepository implements IWarehouseRepository {
  constructor(private prisma: PrismaClient) {}

  async findById(tenantId: string, id: string): Promise<Warehouse | null> {
    const record = await this.prisma.warehouse.findUnique({
      where: { id, tenantId },
    });
    if (!record) return null;
    return Warehouse.create({
      id: record.id,
      tenantId: record.tenantId,
      name: record.name,
      address: record.address ?? undefined,
    });
  }

  async findAllByTenantId(tenantId: string): Promise<Warehouse[]> {
    const records = await this.prisma.warehouse.findMany({
      where: { tenantId },
      orderBy: { name: 'asc' },
    });
    return records.map((record) =>
      Warehouse.create({
        id: record.id,
        tenantId: record.tenantId,
        name: record.name,
        address: record.address ?? undefined,
      })
    );
  }

  async save(warehouse: Warehouse): Promise<void> {
    await this.prisma.warehouse.upsert({
      where: { id: warehouse.id },
      update: {
        name: warehouse.name,
        address: warehouse.address,
      },
      create: {
        id: warehouse.id,
        tenantId: warehouse.tenantId,
        name: warehouse.name,
        address: warehouse.address,
      },
    });
  }

  async delete(tenantId: string, id: string): Promise<void> {
    await this.prisma.warehouse.delete({
      where: { id, tenantId },
    });
  }
}
