import { InvoiceStatusHistory } from '../../domain/InvoiceStatusHistory';
import { IInvoiceWriteTransaction } from '../ports/IInvoiceWriteTransaction';

/**
 * System-triggered transition, same shape as `ExpireQuotationUseCase` — no
 * acting user, because the scheduler is not a person.
 */
export class MarkInvoiceOverdueUseCase {
  constructor(private writeTx: IInvoiceWriteTransaction) {}

  async execute(input: { tenantId: string; invoiceId: string }) {
    return this.writeTx.run(async (repos) => {
      const invoice = await repos.invoiceRepo.findById(input.tenantId, input.invoiceId);
      if (!invoice) {
        throw new Error('Invoice not found');
      }

      const fromStatus = invoice.status;
      invoice.markOverdue();

      const history = InvoiceStatusHistory.create({
        id: crypto.randomUUID(),
        tenantId: input.tenantId,
        invoiceId: input.invoiceId,
        fromStatus,
        toStatus: invoice.status,
        // NULL: the scheduler made this change, not a person. Same convention
        // as QuotationStatusHistory.changedByUserId.
        changedByUserId: null
      });

      await repos.invoiceRepo.save(invoice);
      await repos.historyRepo.save(history);

      return { invoice };
    });
  }
}
