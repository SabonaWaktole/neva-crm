import { ExpireQuotationUseCase } from './ExpireQuotationUseCase';
import { IQuotationRepository } from '../../domain/IQuotationRepository';
import { IQuotationStatusHistoryRepository } from '../../domain/IQuotationStatusHistoryRepository';
import { Quotation, QuotationStatus } from '../../domain/Quotation';
import { QuotationLineItem } from '../../domain/QuotationLineItem';
import { UserRole } from '../../../auth/domain/enums/UserRole';

describe('ExpireQuotationUseCase', () => {
  let useCase: ExpireQuotationUseCase;
  let quotationRepo: jest.Mocked<IQuotationRepository>;
  let historyRepo: jest.Mocked<IQuotationStatusHistoryRepository>;

  beforeEach(() => {
    quotationRepo = { findById: jest.fn(), findPendingApprovals: jest.fn(), search: jest.fn(), save: jest.fn() };
    historyRepo = { findByQuotationId: jest.fn(), save: jest.fn() };

    useCase = new ExpireQuotationUseCase(quotationRepo, historyRepo);
  });

  function makeQuotation(status: QuotationStatus, createdByUserId: string): Quotation {
    const li = QuotationLineItem.create({
      id: 'li1', tenantId: 'tenant-1', quotationId: 'q1', productId: 'p1', warehouseId: 'w1', quantity: 1, unitPrice: 10
    });
    return Quotation.create({
      id: 'q1', tenantId: 'tenant-1', clientId: 'c1', createdByUserId, lineItems: [li], status
    });
  }

  it('should expire quotation and write history', async () => {
    const quotation = makeQuotation(QuotationStatus.Sent, 'user-1');
    quotationRepo.findById.mockResolvedValue(quotation);

    const result = await useCase.execute({
      tenantId: 'tenant-1',
      quotationId: 'q1',
      actingUserId: 'user-1',
      actingUserRole: UserRole.STAFF
    });

    expect(result.quotation.status).toBe(QuotationStatus.Expired);
    expect(quotationRepo.save).toHaveBeenCalledTimes(1);
    expect(historyRepo.save).toHaveBeenCalledTimes(1);
  });

  it('should prevent Staff from expiring another Staffs quotation', async () => {
    const quotation = makeQuotation(QuotationStatus.Sent, 'user-2');
    quotationRepo.findById.mockResolvedValue(quotation);

    await expect(useCase.execute({
      tenantId: 'tenant-1', quotationId: 'q1', actingUserId: 'user-1', actingUserRole: UserRole.STAFF
    })).rejects.toThrow('Unauthorized: Staff can only act on their own quotations');
  });

  it('should allow Business Owner to expire any quotation', async () => {
    const quotation = makeQuotation(QuotationStatus.Sent, 'user-2');
    quotationRepo.findById.mockResolvedValue(quotation);

    const result = await useCase.execute({
      tenantId: 'tenant-1', quotationId: 'q1', actingUserId: 'owner-1', actingUserRole: UserRole.BUSINESS_OWNER
    });

    expect(result.quotation.status).toBe(QuotationStatus.Expired);
  });

  it('should reject if not in Sent status', async () => {
    const quotation = makeQuotation(QuotationStatus.PendingApproval, 'user-1');
    quotationRepo.findById.mockResolvedValue(quotation);

    await expect(useCase.execute({
      tenantId: 'tenant-1', quotationId: 'q1', actingUserId: 'owner-1', actingUserRole: UserRole.BUSINESS_OWNER
    })).rejects.toThrow('Invalid state transition');
  });
});
