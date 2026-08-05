import { IInvoiceRepository } from '../../domain/IInvoiceRepository';
import { IInvoiceLineItemRepository } from '../../domain/IInvoiceLineItemRepository';
import { IInvoiceStatusHistoryRepository } from '../../domain/IInvoiceStatusHistoryRepository';
import { UserRole } from '../../../auth/domain/enums/UserRole';
import { InvoiceStatus } from '../../domain/Invoice';

export class GetInvoiceDetailUseCase {
  constructor(
    private invoiceRepo: IInvoiceRepository,
    private lineItemRepo: IInvoiceLineItemRepository,
    private historyRepo: IInvoiceStatusHistoryRepository
  ) {}

  async execute(input: {
    tenantId: string;
    invoiceId: string;
    actingUserId: string;
    actingUserRole: string;
  }) {
    const invoice = await this.invoiceRepo.findById(input.tenantId, input.invoiceId);
    if (!invoice) {
      throw new Error('Invoice not found');
    }

    if (input.actingUserRole === UserRole.STAFF && invoice.createdByUserId !== input.actingUserId) {
      throw new Error('Unauthorized: Staff can only view their own invoices');
    }

    const lineItems = await this.lineItemRepo.findByInvoiceId(input.tenantId, input.invoiceId);
    const history = await this.historyRepo.findByInvoiceId(input.tenantId, input.invoiceId);

    const isOwner = input.actingUserRole === UserRole.BUSINESS_OWNER;
    const isCreator = invoice.createdByUserId === input.actingUserId;
    const canAct = isOwner || (input.actingUserRole === UserRole.STAFF && isCreator);

    const permittedActions: string[] = [];
    if (canAct) {
      switch (invoice.status) {
        case InvoiceStatus.Draft:
          permittedActions.push('SEND', 'VOID');
          break;
        case InvoiceStatus.Sent:
        case InvoiceStatus.Overdue:
          permittedActions.push('MARK_PAID', 'VOID');
          break;
      }
    }

    return { invoice, lineItems, history, permittedActions };
  }
}
