import { InvoiceStatusHistory } from './InvoiceStatusHistory';

export interface IInvoiceStatusHistoryRepository {
  findByInvoiceId(tenantId: string, invoiceId: string): Promise<InvoiceStatusHistory[]>;
  save(history: InvoiceStatusHistory): Promise<void>;
}
