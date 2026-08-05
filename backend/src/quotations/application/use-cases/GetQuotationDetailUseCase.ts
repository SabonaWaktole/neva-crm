import { IQuotationRepository } from '../../domain/IQuotationRepository';
import { IQuotationLineItemRepository } from '../../domain/IQuotationLineItemRepository';
import { IQuotationStatusHistoryRepository } from '../../domain/IQuotationStatusHistoryRepository';
import { IInvoiceRepository } from '../../../invoices/domain/IInvoiceRepository';
import { UserRole } from '../../../auth/domain/enums/UserRole';
import { QuotationStatus } from '../../domain/Quotation';

export class GetQuotationDetailUseCase {
  constructor(
    private quotationRepo: IQuotationRepository,
    private lineItemRepo: IQuotationLineItemRepository,
    private historyRepo: IQuotationStatusHistoryRepository,
    // Optional: existing callers (and tests) that construct this use case
    // without an invoice repository still work, just with `invoiceId` always
    // null. Only the real HTTP wiring needs to pass one.
    private invoiceRepo?: IInvoiceRepository
  ) {}

  async execute(input: {
    tenantId: string;
    quotationId: string;
    actingUserId: string;
    actingUserRole: string;
  }) {
    const quotation = await this.quotationRepo.findById(input.tenantId, input.quotationId);
    if (!quotation) {
      throw new Error('Quotation not found');
    }

    if (input.actingUserRole === UserRole.STAFF && quotation.createdByUserId !== input.actingUserId) {
      throw new Error('Unauthorized: Staff can only view their own quotations');
    }

    const lineItems = await this.lineItemRepo.findByQuotationId(input.tenantId, input.quotationId);
    const history = await this.historyRepo.findByQuotationId(input.tenantId, input.quotationId);

    const permittedActions: string[] = [];
    const isOwner = input.actingUserRole === UserRole.BUSINESS_OWNER;
    const isCreator = quotation.createdByUserId === input.actingUserId;
    const canAct = isOwner || (input.actingUserRole === UserRole.STAFF && isCreator);

    switch (quotation.status) {
      case QuotationStatus.Draft:
        if (canAct) {
          permittedActions.push('EDIT', 'SUBMIT');
        }
        break;
      case QuotationStatus.PendingApproval:
        if (isOwner) {
          permittedActions.push('APPROVE', 'RETURN_TO_DRAFT');
        }
        break;
      case QuotationStatus.Sent:
        if (canAct) {
          permittedActions.push('MARK_ACCEPTED', 'MARK_REJECTED', 'EXPIRE');
        }
        break;
      case QuotationStatus.Rejected:
        // Revising a Rejected quotation and saving it resends it — see
        // UpdateQuotationUseCase.
        if (canAct) {
          permittedActions.push('EDIT');
        }
        break;
    }

    /*
     * Whether this quotation has already been converted to an invoice — the
     * frontend uses this to show "Convert to Invoice" only when the answer is
     * no. `findByQuotationId` returns at most one row: the DB enforces
     * one-quotation-to-at-most-one-invoice via a unique constraint.
     */
    const invoice = this.invoiceRepo
      ? await this.invoiceRepo.findByQuotationId(input.tenantId, input.quotationId)
      : null;

    return { quotation, lineItems, history, permittedActions, invoiceId: invoice?.id ?? null };
  }
}
