import { PrismaClient } from '@prisma/client';
import { IOutcomeCategoryRepository } from '../../domain/repositories/IOutcomeCategoryRepository';
import { OutcomeCategory } from '../../domain/entities/OutcomeCategory';

export class PrismaOutcomeCategoryRepository implements IOutcomeCategoryRepository {
  constructor(private prisma: PrismaClient) {}

  async findByTenantId(tenantId: string): Promise<OutcomeCategory[]> {
    const records = await this.prisma.outcomeCategory.findMany({
      where: { tenantId },
    });
    return records.map(r => OutcomeCategory.create(r));
  }

  async findById(tenantId: string, id: string): Promise<OutcomeCategory | null> {
    const record = await this.prisma.outcomeCategory.findUnique({
      where: { id },
    });
    if (!record || record.tenantId !== tenantId) return null;
    return OutcomeCategory.create(record);
  }

  async save(tenantId: string, category: OutcomeCategory): Promise<void> {
    await this.prisma.outcomeCategory.create({
      data: {
        id: category.id,
        tenantId: category.tenantId,
        label: category.label,
      },
    });
  }
}
