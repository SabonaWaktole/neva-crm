import { Invoice } from './Invoice';

export interface InvoiceFilters {
  tenantId: string;
  query?: string;
  status?: string;
  clientId?: string;
  page?: number;
  limit?: number;
}

export interface PaginatedInvoices {
  data: Invoice[];
  total: number;
}

export interface IInvoiceRepository {
  findById(tenantId: string, id: string): Promise<Invoice | null>;
  findByQuotationId(tenantId: string, quotationId: string): Promise<Invoice | null>;
  search(filters: InvoiceFilters): Promise<PaginatedInvoices>;
  save(invoice: Invoice): Promise<void>;
}
