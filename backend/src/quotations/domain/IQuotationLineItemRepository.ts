import { QuotationLineItem } from './QuotationLineItem';

export interface IQuotationLineItemRepository {
  findByQuotationId(tenantId: string, quotationId: string): Promise<QuotationLineItem[]>;
  save(lineItem: QuotationLineItem): Promise<void>;
  saveMany(lineItems: QuotationLineItem[]): Promise<void>;
  deleteManyByQuotationId(tenantId: string, quotationId: string): Promise<void>;
}
