import { PrismaClient } from '@prisma/client';
import { ICategoryRepository, CategoryWithItemCount } from '../../domain/repositories';
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
      description: record.description,
      isArchived: record.isArchived,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    });
  }

  async findAllByTenantId(tenantId: string, includeArchived: boolean = false): Promise<Category[]> {
    const records = await this.prisma.category.findMany({
      where: { 
        tenantId,
        ...(includeArchived ? {} : { isArchived: false })
      },
      orderBy: { name: 'asc' },
    });
    return records.map((record) =>
      Category.create({
        id: record.id,
        tenantId: record.tenantId,
        name: record.name,
        description: record.description,
        isArchived: record.isArchived,
        createdAt: record.createdAt,
        updatedAt: record.updatedAt,
      })
    );
  }

  async findAllWithItemCount(tenantId: string, includeArchived: boolean = false): Promise<CategoryWithItemCount[]> {
    const records = await this.prisma.category.findMany({
      where: { 
        tenantId,
        ...(includeArchived ? {} : { isArchived: false })
      },
      include: {
        _count: {
          select: { products: true }
        }
      },
      orderBy: { name: 'asc' },
    });

    return records.map(record => ({
      category: Category.create({
        id: record.id,
        tenantId: record.tenantId,
        name: record.name,
        description: record.description,
        isArchived: record.isArchived,
        createdAt: record.createdAt,
        updatedAt: record.updatedAt,
      }),
      itemCount: record._count.products
    }));
  }

  async findLeastRecentlyUsedCategories(tenantId: string, limit: number): Promise<Category[]> {
    // Raw SQL to find categories ordered by the most recent product/stock interaction.
    // If a category has no products, or products have no stock movements, we fall back to product or category updatedAt.
    const rows = await this.prisma.$queryRaw<Array<{
      id: string,
      name: string,
      description: string | null,
      isArchived: boolean,
      createdAt: Date,
      updatedAt: Date
    }>>`
      SELECT c.id, c.name, c.description, c."isArchived", c."createdAt", c."updatedAt",
             GREATEST(
               c."updatedAt",
               COALESCE(MAX(p."updatedAt"), '1970-01-01'::timestamp),
               COALESCE(MAX(sm."createdAt"), '1970-01-01'::timestamp)
             ) as last_used_at
      FROM "Category" c
      LEFT JOIN "Product" p ON p."categoryId" = c.id
      LEFT JOIN "StockMovement" sm ON sm."productId" = p.id
      WHERE c."tenantId" = ${tenantId} AND c."isArchived" = false
      GROUP BY c.id
      ORDER BY last_used_at ASC
      LIMIT ${limit};
    `;

    return rows.map((record) =>
      Category.create({
        id: record.id,
        tenantId,
        name: record.name,
        description: record.description,
        isArchived: record.isArchived,
        createdAt: record.createdAt,
        updatedAt: record.updatedAt,
      })
    );
  }

  async save(category: Category): Promise<void> {
    await this.prisma.category.create({
      data: {
        id: category.id,
        tenantId: category.tenantId,
        name: category.name,
        description: category.description,
        isArchived: category.isArchived,
        createdAt: category.createdAt,
        updatedAt: category.updatedAt,
      },
    });
  }

  async update(category: Category): Promise<void> {
    await this.prisma.category.update({
      where: { id: category.id, tenantId: category.tenantId },
      data: {
        name: category.name,
        description: category.description,
        isArchived: category.isArchived,
        updatedAt: category.updatedAt,
      },
    });
  }

  async delete(tenantId: string, id: string): Promise<void> {
    await this.prisma.category.delete({
      where: { id, tenantId },
    });
  }
}
