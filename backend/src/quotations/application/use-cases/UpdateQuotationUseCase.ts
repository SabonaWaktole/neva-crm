import { IQuotationRepository } from '../../domain/IQuotationRepository';
import { IQuotationLineItemRepository } from '../../domain/IQuotationLineItemRepository';
import { IProductRepository, IWarehouseRepository } from '../../../inventory/domain/repositories';
import { QuotationLineItem } from '../../domain/QuotationLineItem';
import { QuotationStatus } from '../../domain/Quotation';
import { UserRole } from '../../../auth/domain/enums/UserRole';

export class UpdateQuotationUseCase {
  constructor(
    private quotationRepo: IQuotationRepository,
    private lineItemRepo: IQuotationLineItemRepository,
    private productRepo: IProductRepository,
    private warehouseRepo: IWarehouseRepository
  ) {}

  async execute(input: {
    tenantId: string;
    quotationId: string;
    actingUserId: string;
    actingUserRole: string;
    lineItems: Array<{ productId: string; warehouseId: string; quantity: number; unitPrice: number }>;
  }) {
    const quotation = await this.quotationRepo.findById(input.tenantId, input.quotationId);
    if (!quotation) {
      throw new Error('Quotation not found');
    }

    if (input.actingUserRole === UserRole.STAFF && quotation.createdByUserId !== input.actingUserId) {
      throw new Error('Unauthorized: Staff can only act on their own quotations');
    }

    if (quotation.status !== QuotationStatus.Draft) {
      throw new Error('Only Draft quotations can be updated');
    }

    if (!input.lineItems || input.lineItems.length === 0) {
      throw new Error('A quotation must have at least one line item');
    }

    const newLineItems: QuotationLineItem[] = [];

    for (const li of input.lineItems) {
      const product = await this.productRepo.findById(input.tenantId, li.productId);
      if (!product) {
        throw new Error(`Product ${li.productId} not found`);
      }
      if (product.tenantId !== input.tenantId) {
        throw new Error(`Product ${li.productId} does not belong to this tenant`);
      }

      const warehouse = await this.warehouseRepo.findById(input.tenantId, li.warehouseId);
      if (!warehouse) {
        throw new Error(`Warehouse ${li.warehouseId} not found`);
      }
      if (warehouse.tenantId !== input.tenantId) {
        throw new Error(`Warehouse ${li.warehouseId} does not belong to this tenant`);
      }

      newLineItems.push(
        QuotationLineItem.create({
          id: crypto.randomUUID(),
          tenantId: input.tenantId,
          quotationId: input.quotationId,
          productId: li.productId,
          warehouseId: li.warehouseId,
          quantity: li.quantity,
          unitPrice: li.unitPrice
        })
      );
    }

    quotation.lineItems = newLineItems;

    await this.lineItemRepo.deleteManyByQuotationId(input.tenantId, input.quotationId);
    await this.lineItemRepo.saveMany(newLineItems);
    await this.quotationRepo.save(quotation);

    return { quotation };
  }
}
