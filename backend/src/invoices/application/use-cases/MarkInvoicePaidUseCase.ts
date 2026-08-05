import { InvoiceStatusHistory } from '../../domain/InvoiceStatusHistory';
import { UserRole } from '../../../auth/domain/enums/UserRole';
import { IInvoiceWriteTransaction } from '../ports/IInvoiceWriteTransaction';

export class MarkInvoicePaidUseCase {
  constructor(private writeTx: IInvoiceWriteTransaction) {}

  async execute(input: {
    tenantId: string;
    invoiceId: string;
    actingUserId: string;
    actingUserRole: string;
  }) {
    return this.writeTx.run(async (repos) => {
      const invoice = await repos.invoiceRepo.findById(input.tenantId, input.invoiceId);
      if (!invoice) {
        throw new Error('Invoice not found');
      }

      if (input.actingUserRole === UserRole.STAFF && invoice.createdByUserId !== input.actingUserId) {
        throw new Error('Unauthorized: Staff can only act on their own invoices');
      }

      const fromStatus = invoice.status;
      invoice.markPaid();

      const history = InvoiceStatusHistory.create({
        id: crypto.randomUUID(),
        tenantId: input.tenantId,
        invoiceId: input.invoiceId,
        fromStatus,
        toStatus: invoice.status,
        changedByUserId: input.actingUserId
      });

      await repos.invoiceRepo.save(invoice);
      await repos.historyRepo.save(history);

      return { invoice };
    });
  }
}
