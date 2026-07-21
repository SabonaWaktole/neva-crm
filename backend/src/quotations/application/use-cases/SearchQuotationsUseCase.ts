import { IQuotationRepository } from '../../domain/IQuotationRepository';
import { QuotationStatus } from '../../domain/Quotation';
import { UserRole } from '../../../auth/domain/enums/UserRole';

export class SearchQuotationsUseCase {
  constructor(private quotationRepo: IQuotationRepository) {}

  async execute(input: {
    tenantId: string;
    actingUserId: string;
    actingUserRole: string;
    params: {
      query?: string;
      status?: QuotationStatus;
      clientId?: string;
      page?: number;
      limit?: number;
    };
  }) {
    const page = input.params.page || 1;
    const limit = input.params.limit || 10;

    // Staff can only see their own quotations
    const createdByUserId = input.actingUserRole === UserRole.STAFF ? input.actingUserId : undefined;

    const result = await this.quotationRepo.search({
      tenantId: input.tenantId,
      query: input.params.query,
      status: input.params.status,
      clientId: input.params.clientId,
      createdByUserId,
      page,
      limit
    });

    return result;
  }
}
