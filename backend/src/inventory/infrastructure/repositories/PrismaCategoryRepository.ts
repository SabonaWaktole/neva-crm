import { PrismaClient } from '@prisma/client';
import { ICategoryRepository } from '../../domain/repositories';
import { Category } from '../../domain/Category';

export class PrismaCategoryRepository implements ICategoryRepository {
  constructor(private prisma: PrismaClient) {}

  async findById(tenantId: string, id: string): Promise<Category | null> {
    const record = await this.prisma.category.findUnique({
      where: { id, tenantId },
    });
    if (!record) return null;
    return Category.create({
      id: record.id,
      tenantId: record.tenantId,
      name: record.name,
    });
  }

  async findAllByTenantId(tenantId: string): Promise<Category[]> {
    const records = await this.prisma.category.findMany({
      where: { tenantId },
      orderBy: { name: 'asc' },
    });
    return records.map((record) =>
      Category.create({
        id: record.id,
        tenantId: record.tenantId,
        name: record.name,
      })
    );
  }

  async save(category: Category): Promise<void> {
    await this.prisma.category.upsert({
      where: { id: category.id },
      update: {
        name: category.name,
      },
      create: {
        id: category.id,
        tenantId: category.tenantId,
        name: category.name,
      },
    });
  }

  async delete(tenantId: string, id: string): Promise<void> {
    await this.prisma.category.delete({
      where: { id, tenantId },
    });
  }
}
