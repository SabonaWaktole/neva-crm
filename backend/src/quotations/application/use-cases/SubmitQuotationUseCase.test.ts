import { SubmitQuotationUseCase } from './SubmitQuotationUseCase';
import { IQuotationRepository } from '../../domain/IQuotationRepository';
import { IQuotationStatusHistoryRepository } from '../../domain/IQuotationStatusHistoryRepository';
import { Quotation, QuotationStatus } from '../../domain/Quotation';
import { QuotationLineItem } from '../../domain/QuotationLineItem';
import { UserRole } from '../../../auth/domain/enums/UserRole';
import { makeQuotationWriteHarness } from '../../../../tests/support/fakeQuotationWriteTransaction';

describe('SubmitQuotationUseCase', () => {
  let useCase: SubmitQuotationUseCase;
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

    useCase = new SubmitQuotationUseCase(writeTx, userRepo);
  });

  function makeQuotation(status: QuotationStatus, createdByUserId: string): Quotation {
    const li = QuotationLineItem.create({
      id: 'li1', tenantId: 'tenant-1', quotationId: 'q1', productId: 'p1', warehouseId: 'w1', quantity: 1, unitPrice: 10
    });
    return Quotation.create({
      id: 'q1', tenantId: 'tenant-1', clientId: 'c1', createdByUserId, lineItems: [li], status
    });
  }

  it('should submit to PendingApproval when approval is required', async () => {
    const quotation = makeQuotation(QuotationStatus.Draft, 'user-1');
    quotationRepo.findById.mockResolvedValue(quotation);

    const result = await useCase.execute({
      tenantId: 'tenant-1',
      quotationId: 'q1',
      actingUserId: 'user-1',
      actingUserRole: UserRole.STAFF,
      requiresQuotationApproval: true
    });

    expect(result.quotation.status).toBe(QuotationStatus.PendingApproval);
    expect(result.quotation.sentAt).toBeNull();
    expect(quotationRepo.save).toHaveBeenCalledTimes(1);
    expect(historyRepo.save).toHaveBeenCalledTimes(1);
  });

  it('should submit to Sent when approval NOT required and set sentAt', async () => {
    const quotation = makeQuotation(QuotationStatus.Draft, 'user-1');
    quotationRepo.findById.mockResolvedValue(quotation);

    const result = await useCase.execute({
      tenantId: 'tenant-1',
      quotationId: 'q1',
      actingUserId: 'user-1',
      actingUserRole: UserRole.STAFF,
      requiresQuotationApproval: false
    });

    expect(result.quotation.status).toBe(QuotationStatus.Sent);
    expect(result.quotation.sentAt).toBeInstanceOf(Date);
  });

  it('should reject if not in Draft status', async () => {
    const quotation = makeQuotation(QuotationStatus.Sent, 'user-1');
    quotationRepo.findById.mockResolvedValue(quotation);

    await expect(useCase.execute({
      tenantId: 'tenant-1', quotationId: 'q1', actingUserId: 'user-1', actingUserRole: UserRole.STAFF, requiresQuotationApproval: true
    })).rejects.toThrow('Invalid state transition');
  });

  it('should reject if Staff tries to submit another Staffs quotation', async () => {
    const quotation = makeQuotation(QuotationStatus.Draft, 'user-2');
    quotationRepo.findById.mockResolvedValue(quotation);

    await expect(useCase.execute({
      tenantId: 'tenant-1', quotationId: 'q1', actingUserId: 'user-1', actingUserRole: UserRole.STAFF, requiresQuotationApproval: true
    })).rejects.toThrow('Unauthorized: Staff can only act on their own quotations');
  });

  it('should allow Business Owner to submit any quotation', async () => {
    const quotation = makeQuotation(QuotationStatus.Draft, 'user-2');
    quotationRepo.findById.mockResolvedValue(quotation);

    const result = await useCase.execute({
      tenantId: 'tenant-1', quotationId: 'q1', actingUserId: 'owner-1', actingUserRole: UserRole.BUSINESS_OWNER, requiresQuotationApproval: true
    });

    expect(result.quotation.status).toBe(QuotationStatus.PendingApproval);
  });
});
