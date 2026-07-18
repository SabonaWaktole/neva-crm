import { PrismaClient, Prisma } from '@prisma/client';
import { IProductRepository, ProductSearchFilters, ProductWithStock, AvailabilityStatus } from '../../domain/repositories';
import { Product } from '../../domain/Product';

export class PrismaProductRepository implements IProductRepository {
  constructor(private prisma: PrismaClient) {}

  async findById(tenantId: string, id: string): Promise<Product | null> {
    const record = await this.prisma.product.findUnique({
      where: { id, tenantId },
    });
    if (!record) return null;
    return Product.create({
      id: record.id,
      tenantId: record.tenantId,
      name: record.name,
      description: record.description,
      categoryId: record.categoryId,
      price: record.price,
      lowStockThreshold: record.lowStockThreshold,
    });
  }

  async save(product: Product): Promise<void> {
    await this.prisma.product.upsert({
      where: { id: product.id },
      update: {
        name: product.name,
        description: product.description,
        categoryId: product.categoryId,
        price: product.price,
        lowStockThreshold: product.lowStockThreshold,
      },
      create: {
        id: product.id,
        tenantId: product.tenantId,
        name: product.name,
        description: product.description,
        categoryId: product.categoryId,
        price: product.price,
        lowStockThreshold: product.lowStockThreshold,
      },
    });
  }

  async countByCategoryId(tenantId: string, categoryId: string): Promise<number> {
    return this.prisma.product.count({
      where: { tenantId, categoryId },
    });
  }

  async search(tenantId: string, filters: ProductSearchFilters): Promise<ProductWithStock[]> {
    const where: Prisma.ProductWhereInput = { tenantId };

    if (filters.name) {
      where.name = { contains: filters.name, mode: 'insensitive' };
    }
    if (filters.categoryId) {
      where.categoryId = filters.categoryId;
    }
    if (filters.warehouseId) {
      where.stockLevels = { some: { warehouseId: filters.warehouseId } };
    }

    // Prisma doesn't support complex aggregation filtering directly in findMany, 
    // so we fetch the data and then apply the availability filter in-memory.
    // For large catalogs, this would need raw SQL, but for our scale, this works.
    const records = await this.prisma.product.findMany({
      where,
      include: {
        stockLevels: {
          select: { quantity: true },
        },
      },
      orderBy: { name: 'asc' },
    });

    const productsWithStock: ProductWithStock[] = records.map(record => {
      const product = Product.create({
        id: record.id,
        tenantId: record.tenantId,
        name: record.name,
        description: record.description,
        categoryId: record.categoryId,
        price: record.price,
        lowStockThreshold: record.lowStockThreshold,
      });

      const totalStock = record.stockLevels.reduce((sum, sl) => sum + sl.quantity, 0);
      let availability: AvailabilityStatus = 'IN_STOCK';
      if (totalStock === 0) {
        availability = 'OUT_OF_STOCK';
      } else if (totalStock <= product.lowStockThreshold) {
        availability = 'LOW_STOCK';
      }

      return { product, totalStock, availability };
    });

    if (filters.availability) {
      return productsWithStock.filter(pws => pws.availability === filters.availability);
    }

    return productsWithStock;
  }
}
