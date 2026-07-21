import { IQuotationRepository } from '../../domain/IQuotationRepository';
import { UserRole } from '../../../auth/domain/enums/UserRole';

export class GetPendingApprovalsUseCase {
  constructor(private quotationRepo: IQuotationRepository) {}

  async execute(input: {
    tenantId: string;
    actingUserRole: string;
  }) {
    if (input.actingUserRole !== UserRole.BUSINESS_OWNER) {
      throw new Error('Unauthorized: Only Business Owners can view pending approvals');
    }

    const quotations = await this.quotationRepo.findPendingApprovals(input.tenantId);
    return { quotations };
  }
}
