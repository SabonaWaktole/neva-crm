import { PrismaClient } from '@prisma/client';
import { IProductImageRepository } from '../../domain/repositories';
import { ProductImage } from '../../domain/ProductImage';

type ImageRecord = {
  id: string;
  tenantId: string;
  productId: string;
  url: string;
  url2x: string;
  width: number;
  height: number;
  bytes: number;
  position: number;
  createdAt: Date;
};

export class PrismaProductImageRepository implements IProductImageRepository {
  constructor(private prisma: PrismaClient) {}

  private toDomain(record: ImageRecord): ProductImage {
    return ProductImage.create({
      id: record.id,
      tenantId: record.tenantId,
      productId: record.productId,
      productTenantId: record.tenantId,
      url: record.url,
      url2x: record.url2x,
      width: record.width,
      height: record.height,
      bytes: record.bytes,
      position: record.position,
      createdAt: record.createdAt,
    });
  }

  async findByProductId(tenantId: string, productId: string): Promise<ProductImage[]> {
    const records = await this.prisma.productImage.findMany({
      where: { tenantId, productId },
      orderBy: { position: 'asc' },
    });
    return records.map((record) => this.toDomain(record));
  }

  async findById(tenantId: string, id: string): Promise<ProductImage | null> {
    const record = await this.prisma.productImage.findFirst({ where: { tenantId, id } });
    return record ? this.toDomain(record) : null;
  }

  async save(image: ProductImage): Promise<void> {
    await this.prisma.productImage.upsert({
      where: { id: image.id },
      update: { position: image.position },
      create: {
        id: image.id,
        tenantId: image.tenantId,
        productId: image.productId,
        url: image.url,
        url2x: image.url2x,
        width: image.width,
        height: image.height,
        bytes: image.bytes,
        position: image.position,
      },
    });
  }

  async delete(tenantId: string, id: string): Promise<void> {
    await this.prisma.productImage.deleteMany({ where: { tenantId, id } });
  }

  /**
   * Rewrites positions to match `ids` exactly. Scoped by productId as well as
   * id so a crafted request cannot renumber another product's gallery, and run
   * in one transaction so a drag never leaves the gallery half-reordered.
   */
  async reorder(tenantId: string, productId: string, ids: string[]): Promise<void> {
    if (ids.length === 0) return;
    await this.prisma.$transaction(
      ids.map((id, index) =>
        this.prisma.productImage.updateMany({
          where: { tenantId, productId, id },
          data: { position: index },
        })
      )
    );
  }

  async nextPosition(tenantId: string, productId: string): Promise<number> {
    const last = await this.prisma.productImage.findFirst({
      where: { tenantId, productId },
      orderBy: { position: 'desc' },
      select: { position: true },
    });
    return last ? last.position + 1 : 0;
  }

  async countByProductId(tenantId: string, productId: string): Promise<number> {
    return this.prisma.productImage.count({ where: { tenantId, productId } });
  }
}
