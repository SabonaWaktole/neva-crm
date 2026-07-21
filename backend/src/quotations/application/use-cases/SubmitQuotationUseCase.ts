import { IQuotationRepository } from '../../domain/IQuotationRepository';
import { IQuotationStatusHistoryRepository } from '../../domain/IQuotationStatusHistoryRepository';
import { QuotationStatusHistory } from '../../domain/QuotationStatusHistory';
import { UserRole } from '../../../auth/domain/enums/UserRole';

export class SubmitQuotationUseCase {
  constructor(
    private quotationRepo: IQuotationRepository,
    private historyRepo: IQuotationStatusHistoryRepository
  ) {}

  async execute(input: {
    tenantId: string;
    quotationId: string;
    actingUserId: string;
    actingUserRole: string;
    requiresQuotationApproval: boolean;
  }) {
    const quotation = await this.quotationRepo.findById(input.tenantId, input.quotationId);
    if (!quotation) {
      throw new Error('Quotation not found');
    }

    if (input.actingUserRole === UserRole.STAFF && quotation.createdByUserId !== input.actingUserId) {
      throw new Error('Unauthorized: Staff can only act on their own quotations');
    }

    const fromStatus = quotation.status;
    quotation.submit({ requiresApproval: input.requiresQuotationApproval });

    const history = QuotationStatusHistory.create({
      id: crypto.randomUUID(),
      tenantId: input.tenantId,
      quotationId: input.quotationId,
      fromStatus,
      toStatus: quotation.status,
      changedByUserId: input.actingUserId
    });

    await this.quotationRepo.save(quotation);
    await this.historyRepo.save(history);

    return { quotation };
  }
}
