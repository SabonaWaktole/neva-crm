import { GetWarehousesUseCase } from './GetWarehousesUseCase';
import { IWarehouseRepository } from '../../domain/repositories';
import { Warehouse } from '../../domain/Warehouse';
import { UserRole } from '../../../auth/domain/enums/UserRole';

describe('GetWarehousesUseCase', () => {
  let warehouseRepo: jest.Mocked<IWarehouseRepository>;
  let useCase: GetWarehousesUseCase;

  beforeEach(() => {
    warehouseRepo = {
      findById: jest.fn(),
      findAllByTenantId: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };
    useCase = new GetWarehousesUseCase(warehouseRepo);
  });

  it('should allow BUSINESS_OWNER to list warehouses', async () => {
    warehouseRepo.findAllByTenantId.mockResolvedValue([
      Warehouse.create({ id: 'w1', tenantId: 'tenant1', name: 'Hub A' }),
      Warehouse.create({ id: 'w2', tenantId: 'tenant1', name: 'Hub B' })
    ]);

    const results = await useCase.execute({
      tenantId: 'tenant1',
      authorRole: UserRole.BUSINESS_OWNER
    });

    expect(results).toHaveLength(2);
    expect(results[0].name).toBe('Hub A');
    expect(warehouseRepo.findAllByTenantId).toHaveBeenCalledWith('tenant1');
  });

  it('should allow STAFF to list warehouses', async () => {
    warehouseRepo.findAllByTenantId.mockResolvedValue([
      Warehouse.create({ id: 'w1', tenantId: 'tenant1', name: 'Hub A' })
    ]);

    const results = await useCase.execute({
      tenantId: 'tenant1',
      authorRole: UserRole.STAFF
    });

    expect(results).toHaveLength(1);
    expect(warehouseRepo.findAllByTenantId).toHaveBeenCalledWith('tenant1');
  });

  it('should reject SUPER_ADMIN from listing tenant warehouses', async () => {
    await expect(useCase.execute({
      tenantId: 'tenant1',
      authorRole: UserRole.SUPER_ADMIN
    })).rejects.toThrow('Unauthorized');
  });

  it('should explicitly scope query to tenantId, proving tenant isolation', async () => {
    await useCase.execute({
      tenantId: 'tenant-isolated',
      authorRole: UserRole.BUSINESS_OWNER
    });

    // Proves that repository is queried exactly with the passed tenantId
    // preventing cross-tenant data leakage.
    expect(warehouseRepo.findAllByTenantId).toHaveBeenCalledTimes(1);
    expect(warehouseRepo.findAllByTenantId).toHaveBeenCalledWith('tenant-isolated');
  });
});
