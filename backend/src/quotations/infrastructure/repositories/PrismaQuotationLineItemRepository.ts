import { PrismaClient } from '@prisma/client';
import { IQuotationLineItemRepository } from '../../domain/IQuotationLineItemRepository';
import { QuotationLineItem } from '../../domain/QuotationLineItem';

export class PrismaQuotationLineItemRepository implements IQuotationLineItemRepository {
  constructor(private prisma: PrismaClient) {}

  async findByQuotationId(tenantId: string, quotationId: string): Promise<QuotationLineItem[]> {
    const raw = await this.prisma.quotationLineItem.findMany({
      where: {
        tenantId,
        quotationId
      },
      /*
       * Names, not just ids. The detail view renders one row per line item and
       * has nothing else to label it with — without these it printed raw UUIDs
       * where the product name belongs.
       *
       * Resolved on read rather than snapshotted at write time, matching the
       * customer-facing reader: a renamed product should read the same on both
       * sides of the quotation.
       */
      include: {
        product: { select: { name: true } },
        warehouse: { select: { name: true } }
      }
    });

    return raw.map(li => QuotationLineItem.create({
      id: li.id,
      tenantId: li.tenantId,
      quotationId: li.quotationId,
      productId: li.productId,
      warehouseId: li.warehouseId,
      quantity: li.quantity,
      unitPrice: li.unitPrice,
      productName: li.product?.name,
      warehouseName: li.warehouse?.name
    }));
  }

  async save(lineItem: QuotationLineItem): Promise<void> {
    await this.prisma.quotationLineItem.upsert({
      where: { id: lineItem.id },
      update: {
        productId: lineItem.productId,
        warehouseId: lineItem.warehouseId,
        quantity: lineItem.quantity,
        unitPrice: lineItem.unitPrice
      },
      create: {
        id: lineItem.id,
        tenantId: lineItem.tenantId,
        quotationId: lineItem.quotationId,
        productId: lineItem.productId,
        warehouseId: lineItem.warehouseId,
        quantity: lineItem.quantity,
        unitPrice: lineItem.unitPrice
      }
    });
  }

  async saveMany(lineItems: QuotationLineItem[]): Promise<void> {
    if (lineItems.length === 0) return;

    await this.prisma.$transaction(
      lineItems.map(li => 
        this.prisma.quotationLineItem.upsert({
          where: { id: li.id },
          update: {
            productId: li.productId,
            warehouseId: li.warehouseId,
            quantity: li.quantity,
            unitPrice: li.unitPrice
          },
          create: {
            id: li.id,
            tenantId: li.tenantId,
            quotationId: li.quotationId,
            productId: li.productId,
            warehouseId: li.warehouseId,
            quantity: li.quantity,
            unitPrice: li.unitPrice
          }
        })
      )
    );
  }

  async deleteManyByQuotationId(tenantId: string, quotationId: string): Promise<void> {
    await this.prisma.quotationLineItem.deleteMany({
      where: {
        tenantId,
        quotationId
      }
    });
  }
}
