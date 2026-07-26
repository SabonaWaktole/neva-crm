import { UpdateQuotationUseCase } from './UpdateQuotationUseCase';
import { IQuotationRepository } from '../../domain/IQuotationRepository';
import { IQuotationLineItemRepository } from '../../domain/IQuotationLineItemRepository';
import { IProductRepository, IWarehouseRepository } from '../../../inventory/domain/repositories';
import { Quotation, QuotationStatus } from '../../domain/Quotation';
import { QuotationLineItem } from '../../domain/QuotationLineItem';
import { UserRole } from '../../../auth/domain/enums/UserRole';

describe('UpdateQuotationUseCase', () => {
  let useCase: UpdateQuotationUseCase;
  let quotationRepo: jest.Mocked<IQuotationRepository>;
  let lineItemRepo: jest.Mocked<IQuotationLineItemRepository>;
  let productRepo: jest.Mocked<IProductRepository>;
  let warehouseRepo: jest.Mocked<IWarehouseRepository>;

  beforeEach(() => {
    quotationRepo = { findById: jest.fn(), findPendingApprovals: jest.fn(), search: jest.fn(), save: jest.fn() };
    lineItemRepo = { findByQuotationId: jest.fn(), save: jest.fn(), saveMany: jest.fn(), deleteManyByQuotationId: jest.fn() };
    productRepo = {
      findById: jest.fn(), findBySku: jest.fn(), findManyByIds: jest.fn(), findWithStock: jest.fn(),
      save: jest.fn(), saveMany: jest.fn(), delete: jest.fn(), search: jest.fn(), summarise: jest.fn(),
      countByCategoryId: jest.fn(), countQuotationReferences: jest.fn(),
      listBrands: jest.fn(), listTags: jest.fn(),
    };
    warehouseRepo = { findById: jest.fn(), findAllByTenantId: jest.fn(), save: jest.fn(), update: jest.fn(), delete: jest.fn() };

    useCase = new UpdateQuotationUseCase(quotationRepo, lineItemRepo, productRepo, warehouseRepo);
  });

  function makeQuotation(status: QuotationStatus, createdByUserId: string): Quotation {
    const li = QuotationLineItem.create({
      id: 'old-li', tenantId: 'tenant-1', quotationId: 'q1', productId: 'p-old', warehouseId: 'w-old', quantity: 1, unitPrice: 10
    });
    return Quotation.create({
      id: 'q1', tenantId: 'tenant-1', clientId: 'c1', createdByUserId, lineItems: [li], status
    });
  }

  it('should update line items while in Draft', async () => {
    const quotation = makeQuotation(QuotationStatus.Draft, 'user-1');
    quotationRepo.findById.mockResolvedValue(quotation);
    productRepo.findById.mockResolvedValue({ id: 'p1', tenantId: 'tenant-1' } as any);
    warehouseRepo.findById.mockResolvedValue({ id: 'w1', tenantId: 'tenant-1' } as any);

    const result = await useCase.execute({
      tenantId: 'tenant-1',
      quotationId: 'q1',
      actingUserId: 'user-1',
      actingUserRole: UserRole.STAFF,
      lineItems: [{ productId: 'p1', warehouseId: 'w1', quantity: 2, unitPrice: 50 }]
    });

    expect(result.quotation.subtotal).toBe(100);
    expect(result.quotation.lineItems.length).toBe(1);
    expect(result.quotation.lineItems[0].productId).toBe('p1');
    expect(lineItemRepo.deleteManyByQuotationId).toHaveBeenCalledWith('tenant-1', 'q1');
    expect(lineItemRepo.saveMany).toHaveBeenCalledTimes(1);
    expect(quotationRepo.save).toHaveBeenCalledTimes(1);
  });

  it('should reject if quotation not found', async () => {
    quotationRepo.findById.mockResolvedValue(null);

    await expect(useCase.execute({
      tenantId: 'tenant-1', quotationId: 'q1', actingUserId: 'user-1', actingUserRole: UserRole.STAFF, lineItems: []
    })).rejects.toThrow('Quotation not found');
  });

  it('should reject if status is not Draft', async () => {
    const quotation = makeQuotation(QuotationStatus.Sent, 'user-1');
    quotationRepo.findById.mockResolvedValue(quotation);

    await expect(useCase.execute({
      tenantId: 'tenant-1', quotationId: 'q1', actingUserId: 'user-1', actingUserRole: UserRole.STAFF, lineItems: [{ productId: 'p1', warehouseId: 'w1', quantity: 2, unitPrice: 50 }]
    })).rejects.toThrow('Only Draft quotations can be updated');
  });

  it('should reject if Staff tries to update another Staffs quotation', async () => {
    const quotation = makeQuotation(QuotationStatus.Draft, 'user-2');
    quotationRepo.findById.mockResolvedValue(quotation);

    await expect(useCase.execute({
      tenantId: 'tenant-1', quotationId: 'q1', actingUserId: 'user-1', actingUserRole: UserRole.STAFF, lineItems: [{ productId: 'p1', warehouseId: 'w1', quantity: 2, unitPrice: 50 }]
    })).rejects.toThrow('Unauthorized: Staff can only act on their own quotations');
  });

  it('should allow Business Owner to update any quotation in Draft', async () => {
    const quotation = makeQuotation(QuotationStatus.Draft, 'user-2');
    quotationRepo.findById.mockResolvedValue(quotation);
    productRepo.findById.mockResolvedValue({ id: 'p1', tenantId: 'tenant-1' } as any);
    warehouseRepo.findById.mockResolvedValue({ id: 'w1', tenantId: 'tenant-1' } as any);

    const result = await useCase.execute({
      tenantId: 'tenant-1', quotationId: 'q1', actingUserId: 'owner-1', actingUserRole: UserRole.BUSINESS_OWNER, lineItems: [{ productId: 'p1', warehouseId: 'w1', quantity: 2, unitPrice: 50 }]
    });
    
    expect(result.quotation.id).toBe('q1');
  });

  it('should reject zero line items on update', async () => {
    const quotation = makeQuotation(QuotationStatus.Draft, 'user-1');
    quotationRepo.findById.mockResolvedValue(quotation);

    await expect(useCase.execute({
      tenantId: 'tenant-1', quotationId: 'q1', actingUserId: 'user-1', actingUserRole: UserRole.STAFF, lineItems: []
    })).rejects.toThrow('A quotation must have at least one line item');
  });

  it('should reject if productId or warehouseId belongs to different tenant', async () => {
    const quotation = makeQuotation(QuotationStatus.Draft, 'user-1');
    quotationRepo.findById.mockResolvedValue(quotation);
    productRepo.findById.mockResolvedValue({ id: 'p1', tenantId: 'tenant-1' } as any);
    warehouseRepo.findById.mockResolvedValue({ id: 'w1', tenantId: 'tenant-2' } as any);

    await expect(useCase.execute({
      tenantId: 'tenant-1', quotationId: 'q1', actingUserId: 'user-1', actingUserRole: UserRole.STAFF, lineItems: [{ productId: 'p1', warehouseId: 'w1', quantity: 2, unitPrice: 50 }]
    })).rejects.toThrow('Warehouse w1 does not belong to this tenant');
  });
});
