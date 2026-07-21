import { QuotationStatusHistory } from './QuotationStatusHistory';

export interface IQuotationStatusHistoryRepository {
  findByQuotationId(tenantId: string, quotationId: string): Promise<QuotationStatusHistory[]>;
  save(history: QuotationStatusHistory): Promise<void>;
}
