import { GetQuotationDetailUseCase } from './GetQuotationDetailUseCase';
import { IQuotationRepository } from '../../domain/IQuotationRepository';
import { IQuotationLineItemRepository } from '../../domain/IQuotationLineItemRepository';
import { IQuotationStatusHistoryRepository } from '../../domain/IQuotationStatusHistoryRepository';
import { Quotation, QuotationStatus } from '../../domain/Quotation';
import { QuotationLineItem } from '../../domain/QuotationLineItem';
import { QuotationStatusHistory } from '../../domain/QuotationStatusHistory';
import { UserRole } from '../../../auth/domain/enums/UserRole';

describe('GetQuotationDetailUseCase', () => {
  let useCase: GetQuotationDetailUseCase;
  let quotationRepo: jest.Mocked<IQuotationRepository>;
  let lineItemRepo: jest.Mocked<IQuotationLineItemRepository>;
  let historyRepo: jest.Mocked<IQuotationStatusHistoryRepository>;

  beforeEach(() => {
    quotationRepo = { findById: jest.fn(), findPendingApprovals: jest.fn(), search: jest.fn(), save: jest.fn() };
    lineItemRepo = { findByQuotationId: jest.fn(), save: jest.fn(), saveMany: jest.fn(), deleteManyByQuotationId: jest.fn() };
    historyRepo = { findByQuotationId: jest.fn(), save: jest.fn() };

    useCase = new GetQuotationDetailUseCase(quotationRepo, lineItemRepo, historyRepo);
  });

  function makeQuotation(createdByUserId: string): Quotation {
    const li = QuotationLineItem.create({ id: 'li1', tenantId: 'tenant-1', quotationId: 'q1', productId: 'p1', warehouseId: 'w1', quantity: 1, unitPrice: 10 });
    return Quotation.create({
      id: 'q1', tenantId: 'tenant-1', clientId: 'c1', createdByUserId, lineItems: [li], status: QuotationStatus.Draft
    });
  }

  it('should return quotation, line items, and history', async () => {
    const quotation = makeQuotation('user-1');
    const lineItem = QuotationLineItem.create({
      id: 'li1', tenantId: 'tenant-1', quotationId: 'q1', productId: 'p1', warehouseId: 'w1', quantity: 1, unitPrice: 10
    });
    const history = QuotationStatusHistory.create({
      id: 'h1', tenantId: 'tenant-1', quotationId: 'q1', fromStatus: 'NONE', toStatus: QuotationStatus.Draft, changedByUserId: 'user-1'
    });

    quotationRepo.findById.mockResolvedValue(quotation);
    lineItemRepo.findByQuotationId.mockResolvedValue([lineItem]);
    historyRepo.findByQuotationId.mockResolvedValue([history]);

    const result = await useCase.execute({
      tenantId: 'tenant-1',
      quotationId: 'q1',
      actingUserId: 'owner-1',
      actingUserRole: UserRole.BUSINESS_OWNER
    });

    expect(result.quotation.id).toBe('q1');
    expect(result.lineItems.length).toBe(1);
    expect(result.history.length).toBe(1);
  });

  it('should reject if quotation not found', async () => {
    quotationRepo.findById.mockResolvedValue(null);

    await expect(useCase.execute({
      tenantId: 'tenant-1', quotationId: 'q1', actingUserId: 'owner-1', actingUserRole: UserRole.BUSINESS_OWNER
    })).rejects.toThrow('Quotation not found');
  });

  it('should prevent Staff from viewing another Staffs quotation', async () => {
    const quotation = makeQuotation('user-2');
    quotationRepo.findById.mockResolvedValue(quotation);

    await expect(useCase.execute({
      tenantId: 'tenant-1', quotationId: 'q1', actingUserId: 'user-1', actingUserRole: UserRole.STAFF
    })).rejects.toThrow('Unauthorized: Staff can only view their own quotations');
  });
});
