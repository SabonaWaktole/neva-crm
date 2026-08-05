import { InvoiceLineItem } from './InvoiceLineItem';

export interface IInvoiceLineItemRepository {
  findByInvoiceId(tenantId: string, invoiceId: string): Promise<InvoiceLineItem[]>;
  save(lineItem: InvoiceLineItem): Promise<void>;
  saveMany(lineItems: InvoiceLineItem[]): Promise<void>;
}
