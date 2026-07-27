import { ApproveQuotationUseCase } from './ApproveQuotationUseCase';
import { IQuotationRepository } from '../../domain/IQuotationRepository';
import { IQuotationStatusHistoryRepository } from '../../domain/IQuotationStatusHistoryRepository';
import { Quotation, QuotationStatus } from '../../domain/Quotation';
import { QuotationLineItem } from '../../domain/QuotationLineItem';
import { UserRole } from '../../../auth/domain/enums/UserRole';
import { makeQuotationWriteHarness } from '../../../../tests/support/fakeQuotationWriteTransaction';

describe('ApproveQuotationUseCase', () => {
  let useCase: ApproveQuotationUseCase;
  let quotationRepo: jest.Mocked<IQuotationRepository>;
  let historyRepo: jest.Mocked<IQuotationStatusHistoryRepository>;
  let writeTx: ReturnType<typeof makeQuotationWriteHarness>['writeTx'];
  let userRepo: ReturnType<typeof makeQuotationWriteHarness>['userRepo'];

  beforeEach(() => {
    const harness = makeQuotationWriteHarness();
    quotationRepo = harness.quotationRepo;
    historyRepo = harness.historyRepo;
    writeTx = harness.writeTx;
    userRepo = harness.userRepo;

    useCase = new ApproveQuotationUseCase(writeTx, userRepo);
  });

  function makeQuotation(status: QuotationStatus): Quotation {
    const li = QuotationLineItem.create({
      id: 'li1', tenantId: 'tenant-1', quotationId: 'q1', productId: 'p1', warehouseId: 'w1', quantity: 1, unitPrice: 10
    });
    return Quotation.create({
      id: 'q1', tenantId: 'tenant-1', clientId: 'c1', createdByUserId: 'user-1', lineItems: [li], status
    });
  }

  it('should approve and transition to Sent', async () => {
    const quotation = makeQuotation(QuotationStatus.PendingApproval);
    quotationRepo.findById.mockResolvedValue(quotation);

    const result = await useCase.execute({
      tenantId: 'tenant-1',
      quotationId: 'q1',
      actingUserId: 'owner-1',
      actingUserRole: UserRole.BUSINESS_OWNER
    });

    expect(result.quotation.status).toBe(QuotationStatus.Sent);
    expect(result.quotation.sentAt).toBeInstanceOf(Date);
    expect(quotationRepo.save).toHaveBeenCalledTimes(1);
    expect(historyRepo.save).toHaveBeenCalledTimes(1);
  });

  it('should reject STAFF role', async () => {
    await expect(useCase.execute({
      tenantId: 'tenant-1', quotationId: 'q1', actingUserId: 'user-1', actingUserRole: UserRole.STAFF
    })).rejects.toThrow('Unauthorized: Only Business Owners can approve quotations');
  });

  it('should reject if quotation not found', async () => {
    quotationRepo.findById.mockResolvedValue(null);

    await expect(useCase.execute({
      tenantId: 'tenant-1', quotationId: 'q1', actingUserId: 'owner-1', actingUserRole: UserRole.BUSINESS_OWNER
    })).rejects.toThrow('Quotation not found');
  });

  it('should reject if not in PendingApproval status', async () => {
    const quotation = makeQuotation(QuotationStatus.Draft);
    quotationRepo.findById.mockResolvedValue(quotation);

    await expect(useCase.execute({
      tenantId: 'tenant-1', quotationId: 'q1', actingUserId: 'owner-1', actingUserRole: UserRole.BUSINESS_OWNER
    })).rejects.toThrow('Invalid state transition');
  });
});
