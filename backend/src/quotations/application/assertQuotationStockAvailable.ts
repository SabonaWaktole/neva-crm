import { QuotationLineItem } from '../domain/QuotationLineItem';
import { IQuotationLineItemRepository } from '../domain/IQuotationLineItemRepository';
import { IStockLevelRepository } from '../../inventory/domain/repositories';

/**
 * Refuses a quotation whose line items promise more than the warehouse has.
 *
 * Originally only Accept ran this — a customer could open a quotation, click
 * Accept, and be told at that point that half the items were unavailable.
 * Called on every route into SENT too (Submit-without-approval, Approve) so
 * the client's very first look at the quotation already reflects what can
 * actually be fulfilled, not just what someone typed into a line item.
 *
 * Deliberately read-only and pre-transaction: this is a check, not a
 * reservation. Nothing is locked or deducted here — Accept still does its own
 * pass immediately before the deduction, because stock can move between this
 * call and that one, and only Accept's copy is the one that has to be right
 * at the moment it commits.
 *
 * Takes the line items rather than fetching them, so a caller that already
 * has them (Accept, which needs the list again right after for the
 * deduction) does not pay for a second identical query.
 */
export async function assertStockAvailable(
  tenantId: string,
  lineItems: QuotationLineItem[],
  stockLevelRepo: IStockLevelRepository
): Promise<void> {
  for (const li of lineItems) {
    const stock = await stockLevelRepo.findByProductAndWarehouse(tenantId, li.productId, li.warehouseId);
    if (!stock) {
      throw new Error(`Stock level not found for product ${li.productId} at warehouse ${li.warehouseId}`);
    }
    if (stock.quantity < li.quantity) {
      throw new Error(`Insufficient stock for product ${li.productId} at warehouse ${li.warehouseId}`);
    }
  }
}

/** Convenience for callers that have not already loaded the line items. */
export async function assertQuotationStockAvailable(
  tenantId: string,
  quotationId: string,
  lineItemRepo: IQuotationLineItemRepository,
  stockLevelRepo: IStockLevelRepository
): Promise<void> {
  const lineItems = await lineItemRepo.findByQuotationId(tenantId, quotationId);
  await assertStockAvailable(tenantId, lineItems, stockLevelRepo);
}
