import { PrismaClient } from '@prisma/client';
import { IInvoiceLineItemRepository } from '../../domain/IInvoiceLineItemRepository';
import { InvoiceLineItem } from '../../domain/InvoiceLineItem';

export class PrismaInvoiceLineItemRepository implements IInvoiceLineItemRepository {
  constructor(private prisma: PrismaClient) {}

  async findByInvoiceId(tenantId: string, invoiceId: string): Promise<InvoiceLineItem[]> {
    const raw = await this.prisma.invoiceLineItem.findMany({
      where: { tenantId, invoiceId },
      include: {
        product: { select: { name: true } },
        warehouse: { select: { name: true } }
      }
    });

    return raw.map((li) =>
      InvoiceLineItem.create({
        id: li.id,
        tenantId: li.tenantId,
        invoiceId: li.invoiceId,
        productId: li.productId,
        warehouseId: li.warehouseId,
        quantity: li.quantity,
        unitPrice: li.unitPrice,
        productName: li.product?.name,
        warehouseName: li.warehouse?.name
      })
    );
  }

  async save(lineItem: InvoiceLineItem): Promise<void> {
    await this.prisma.invoiceLineItem.upsert({
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
        invoiceId: lineItem.invoiceId,
        productId: lineItem.productId,
        warehouseId: lineItem.warehouseId,
        quantity: lineItem.quantity,
        unitPrice: lineItem.unitPrice
      }
    });
  }

  /**
   * `Promise.all` of individual upserts, deliberately NOT `this.prisma.$transaction([...])`.
   *
   * Unlike `PrismaQuotationLineItemRepository.saveMany` (called standalone,
   * against the plain client), this repository's only caller is
   * `ConvertQuotationToInvoiceUseCase`, and it is always called from inside
   * `PrismaInvoiceWriteTransaction.run()` — so `this.prisma` here is already a
   * `Prisma.TransactionClient`, which has no `$transaction` of its own
   * (nested transactions are not a thing Prisma supports). The outer
   * transaction already provides the atomicity `$transaction([...])` would
   * have added.
   */
  async saveMany(lineItems: InvoiceLineItem[]): Promise<void> {
    if (lineItems.length === 0) return;

    await Promise.all(
      lineItems.map((li) =>
        this.prisma.invoiceLineItem.upsert({
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
            invoiceId: li.invoiceId,
            productId: li.productId,
            warehouseId: li.warehouseId,
            quantity: li.quantity,
            unitPrice: li.unitPrice
          }
        })
      )
    );
  }
}
