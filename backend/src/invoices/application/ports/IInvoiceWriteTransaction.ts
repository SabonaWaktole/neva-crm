import { IInvoiceRepository } from '../../domain/IInvoiceRepository';
import { IInvoiceLineItemRepository } from '../../domain/IInvoiceLineItemRepository';
import { IInvoiceStatusHistoryRepository } from '../../domain/IInvoiceStatusHistoryRepository';

/** The repositories an invoice write goes through, all on one connection. */
export interface InvoiceWriteRepos {
  invoiceRepo: IInvoiceRepository;
  lineItemRepo: IInvoiceLineItemRepository;
  historyRepo: IInvoiceStatusHistoryRepository;
}

/**
 * Runs the writes of an invoice status transition (or the initial conversion)
 * atomically.
 *
 * Same rationale as `IQuotationWriteTransaction`: a status change and its
 * audit-history row are two independent `save()` calls, and a failure between
 * them would leave an invoice whose own history cannot explain how it got
 * there. This port hands the caller repositories bound to one transaction so
 * that guarantee is real, not merely hoped for.
 */
export interface IInvoiceWriteTransaction {
  run<T>(work: (repos: InvoiceWriteRepos) => Promise<T>): Promise<T>;
}
