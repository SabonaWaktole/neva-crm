import { IQuotationRepository } from '../../domain/IQuotationRepository';
import { IQuotationStatusHistoryRepository } from '../../domain/IQuotationStatusHistoryRepository';
import { QuotationStatusHistory } from '../../domain/QuotationStatusHistory';
import { UserRole } from '../../../auth/domain/enums/UserRole';

export class ReturnQuotationToDraftUseCase {
  constructor(
    private quotationRepo: IQuotationRepository,
    private historyRepo: IQuotationStatusHistoryRepository
  ) {}

  async execute(input: {
    tenantId: string;
    quotationId: string;
    actingUserId: string;
    actingUserRole: string;
    reason?: string;
  }) {
    if (input.actingUserRole !== UserRole.BUSINESS_OWNER) {
      throw new Error('Unauthorized: Only Business Owners can return quotations');
    }

    const quotation = await this.quotationRepo.findById(input.tenantId, input.quotationId);
    if (!quotation) {
      throw new Error('Quotation not found');
    }

    const fromStatus = quotation.status;
    quotation.returnToDraft();

    const history = QuotationStatusHistory.create({
      id: crypto.randomUUID(),
      tenantId: input.tenantId,
      quotationId: input.quotationId,
      fromStatus,
      toStatus: quotation.status,
      changedByUserId: input.actingUserId,
      note: input.reason
    });

    await this.quotationRepo.save(quotation);
    await this.historyRepo.save(history);

    return { quotation };
  }
}
