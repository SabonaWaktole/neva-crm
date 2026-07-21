import { CreateQuotationUseCase } from './CreateQuotationUseCase';
import { IQuotationRepository } from '../../domain/IQuotationRepository';
import { IQuotationLineItemRepository } from '../../domain/IQuotationLineItemRepository';
import { IQuotationStatusHistoryRepository } from '../../domain/IQuotationStatusHistoryRepository';
import { IClientRepository } from '../../../clients/domain/repositories/IClientRepository';
import { IProductRepository, IWarehouseRepository } from '../../../inventory/domain/repositories';
import { QuotationStatus } from '../../domain/Quotation';
import { UserRole } from '../../../auth/domain/enums/UserRole';

describe('CreateQuotationUseCase', () => {
  let useCase: CreateQuotationUseCase;
  let quotationRepo: jest.Mocked<IQuotationRepository>;
  let lineItemRepo: jest.Mocked<IQuotationLineItemRepository>;
  let historyRepo: jest.Mocked<IQuotationStatusHistoryRepository>;
  let clientRepo: jest.Mocked<IClientRepository>;
  let productRepo: jest.Mocked<IProductRepository>;
  let warehouseRepo: jest.Mocked<IWarehouseRepository>;

  beforeEach(() => {
    quotationRepo = { findById: jest.fn(), findPendingApprovals: jest.fn(), search: jest.fn(), save: jest.fn() };
    lineItemRepo = { findByQuotationId: jest.fn(), save: jest.fn(), saveMany: jest.fn(), deleteManyByQuotationId: jest.fn() };
    historyRepo = { findByQuotationId: jest.fn(), save: jest.fn() };
    clientRepo = { findById: jest.fn(), search: jest.fn(), countByTenant: jest.fn(), findRecentByTenant: jest.fn(), save: jest.fn(), update: jest.fn() } as any;
    productRepo = { findById: jest.fn(), save: jest.fn(), search: jest.fn(), countByCategoryId: jest.fn() };
    warehouseRepo = { findById: jest.fn(), findAllByTenantId: jest.fn(), save: jest.fn(), delete: jest.fn() };

    useCase = new CreateQuotationUseCase(quotationRepo, lineItemRepo, historyRepo, clientRepo, productRepo, warehouseRepo);
  });

  it('should create a quotation in Draft with correct subtotal', async () => {
    clientRepo.findById.mockResolvedValue({ id: 'c1', tenantId: 'tenant-1' } as any);
    productRepo.findById.mockResolvedValue({ id: 'p1', tenantId: 'tenant-1' } as any);
    warehouseRepo.findById.mockResolvedValue({ id: 'w1', tenantId: 'tenant-1' } as any);

    const result = await useCase.execute({
      tenantId: 'tenant-1',
      clientId: 'c1',
      createdByUserId: 'user-1',
      lineItems: [{ productId: 'p1', warehouseId: 'w1', quantity: 5, unitPrice: 100 }],
      authorRole: UserRole.BUSINESS_OWNER
    });

    expect(result.quotation.status).toBe(QuotationStatus.Draft);
    expect(result.quotation.subtotal).toBe(500);
    expect(quotationRepo.save).toHaveBeenCalledTimes(1);
    expect(lineItemRepo.saveMany).toHaveBeenCalledTimes(1);
    expect(historyRepo.save).toHaveBeenCalledTimes(1);
  });

  it('should reject if clientId not found', async () => {
    clientRepo.findById.mockResolvedValue(null);

    await expect(useCase.execute({
      tenantId: 'tenant-1',
      clientId: 'c1',
      createdByUserId: 'user-1',
      lineItems: [{ productId: 'p1', warehouseId: 'w1', quantity: 1, unitPrice: 10 }],
      authorRole: UserRole.BUSINESS_OWNER
    })).rejects.toThrow('Client not found');
  });

  it('should reject if clientId belongs to different tenant', async () => {
    clientRepo.findById.mockResolvedValue({ id: 'c1', tenantId: 'tenant-2' } as any);

    await expect(useCase.execute({
      tenantId: 'tenant-1',
      clientId: 'c1',
      createdByUserId: 'user-1',
      lineItems: [{ productId: 'p1', warehouseId: 'w1', quantity: 1, unitPrice: 10 }],
      authorRole: UserRole.BUSINESS_OWNER
    })).rejects.toThrow('Client does not belong to this tenant');
  });

  it('should reject if productId not found', async () => {
    clientRepo.findById.mockResolvedValue({ id: 'c1', tenantId: 'tenant-1' } as any);
    productRepo.findById.mockResolvedValue(null);

    await expect(useCase.execute({
      tenantId: 'tenant-1',
      clientId: 'c1',
      createdByUserId: 'user-1',
      lineItems: [{ productId: 'p1', warehouseId: 'w1', quantity: 1, unitPrice: 10 }],
      authorRole: UserRole.BUSINESS_OWNER
    })).rejects.toThrow('Product p1 not found');
  });

  it('should reject if warehouseId belongs to different tenant', async () => {
    clientRepo.findById.mockResolvedValue({ id: 'c1', tenantId: 'tenant-1' } as any);
    productRepo.findById.mockResolvedValue({ id: 'p1', tenantId: 'tenant-1' } as any);
    warehouseRepo.findById.mockResolvedValue({ id: 'w1', tenantId: 'tenant-2' } as any);

    await expect(useCase.execute({
      tenantId: 'tenant-1',
      clientId: 'c1',
      createdByUserId: 'user-1',
      lineItems: [{ productId: 'p1', warehouseId: 'w1', quantity: 1, unitPrice: 10 }],
      authorRole: UserRole.BUSINESS_OWNER
    })).rejects.toThrow('Warehouse w1 does not belong to this tenant');
  });

  it('should reject zero line items', async () => {
    clientRepo.findById.mockResolvedValue({ id: 'c1', tenantId: 'tenant-1' } as any);

    await expect(useCase.execute({
      tenantId: 'tenant-1',
      clientId: 'c1',
      createdByUserId: 'user-1',
      lineItems: [],
      authorRole: UserRole.BUSINESS_OWNER
    })).rejects.toThrow('A quotation must have at least one line item');
  });

  it('should reject SUPER_ADMIN role', async () => {
    await expect(useCase.execute({
      tenantId: 'tenant-1',
      clientId: 'c1',
      createdByUserId: 'user-1',
      lineItems: [{ productId: 'p1', warehouseId: 'w1', quantity: 1, unitPrice: 10 }],
      authorRole: UserRole.SUPER_ADMIN
    })).rejects.toThrow('Unauthorized');
  });

  it('should reject line item with quantity 0', async () => {
    clientRepo.findById.mockResolvedValue({ id: 'c1', tenantId: 'tenant-1' } as any);
    productRepo.findById.mockResolvedValue({ id: 'p1', tenantId: 'tenant-1' } as any);
    warehouseRepo.findById.mockResolvedValue({ id: 'w1', tenantId: 'tenant-1' } as any);

    await expect(useCase.execute({
      tenantId: 'tenant-1',
      clientId: 'c1',
      createdByUserId: 'user-1',
      lineItems: [{ productId: 'p1', warehouseId: 'w1', quantity: 0, unitPrice: 10 }],
      authorRole: UserRole.BUSINESS_OWNER
    })).rejects.toThrow('Quantity must be greater than zero');
  });

  it('should reject line item with negative unitPrice', async () => {
    clientRepo.findById.mockResolvedValue({ id: 'c1', tenantId: 'tenant-1' } as any);
    productRepo.findById.mockResolvedValue({ id: 'p1', tenantId: 'tenant-1' } as any);
    warehouseRepo.findById.mockResolvedValue({ id: 'w1', tenantId: 'tenant-1' } as any);

    await expect(useCase.execute({
      tenantId: 'tenant-1',
      clientId: 'c1',
      createdByUserId: 'user-1',
      lineItems: [{ productId: 'p1', warehouseId: 'w1', quantity: 1, unitPrice: -5 }],
      authorRole: UserRole.BUSINESS_OWNER
    })).rejects.toThrow('Unit price cannot be negative');
  });
});
