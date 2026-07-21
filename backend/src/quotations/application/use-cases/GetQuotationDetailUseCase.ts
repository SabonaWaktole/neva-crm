import { IQuotationRepository } from '../../domain/IQuotationRepository';
import { IQuotationLineItemRepository } from '../../domain/IQuotationLineItemRepository';
import { IQuotationStatusHistoryRepository } from '../../domain/IQuotationStatusHistoryRepository';
import { UserRole } from '../../../auth/domain/enums/UserRole';
import { QuotationStatus } from '../../domain/Quotation';

export class GetQuotationDetailUseCase {
  constructor(
    private quotationRepo: IQuotationRepository,
    private lineItemRepo: IQuotationLineItemRepository,
    private historyRepo: IQuotationStatusHistoryRepository
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
    }

    return { quotation, lineItems, history, permittedActions };
  }
}
