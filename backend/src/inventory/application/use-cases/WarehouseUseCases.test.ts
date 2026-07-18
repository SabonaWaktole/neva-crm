import { CreateWarehouseUseCase } from './CreateWarehouseUseCase';
import { UpdateWarehouseUseCase } from './UpdateWarehouseUseCase';
import { DeleteWarehouseUseCase } from './DeleteWarehouseUseCase';
import { IWarehouseRepository, IStockLevelRepository } from '../../domain/repositories';
import { Warehouse } from '../../domain/Warehouse';
import { UserRole } from '../../../auth/domain/enums/UserRole';
import { WarehouseInUseError } from '../../domain/inUseErrors';

describe('Warehouse Use Cases (Business Owner only)', () => {
  let warehouseRepo: jest.Mocked<IWarehouseRepository>;
  let stockLevelRepo: jest.Mocked<IStockLevelRepository>;

  beforeEach(() => {
    warehouseRepo = {
      findById: jest.fn(),
      findAllByTenantId: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
    };
    stockLevelRepo = {
      findById: jest.fn(),
      findByProductAndWarehouse: jest.fn(),
      findByProductId: jest.fn(),
      save: jest.fn(),
      countByWarehouseId: jest.fn(),
    };
  });

  // ===== CreateWarehouseUseCase =====
  describe('CreateWarehouseUseCase', () => {
    let createUseCase: CreateWarehouseUseCase;

    beforeEach(() => {
      createUseCase = new CreateWarehouseUseCase(warehouseRepo);
    });

    it('should create a warehouse (BUSINESS_OWNER)', async () => {
      const result = await createUseCase.execute({
        tenantId: 'tenant1',
        name: 'Main Hub',
        address: '123 Street',
        authorRole: UserRole.BUSINESS_OWNER
      });

      expect(result.name).toBe('Main Hub');
      expect(result.address).toBe('123 Street');
      expect(warehouseRepo.save).toHaveBeenCalledTimes(1);
    });

    it('should reject STAFF', async () => {
      await expect(createUseCase.execute({
        tenantId: 'tenant1',
        name: 'Main Hub',
        authorRole: UserRole.STAFF
      })).rejects.toThrow('Unauthorized: Only Business Owners can manage warehouses.');
    });

    it('should reject SUPER_ADMIN', async () => {
      await expect(createUseCase.execute({
        tenantId: 'tenant1',
        name: 'Main Hub',
        authorRole: UserRole.SUPER_ADMIN
      })).rejects.toThrow('Unauthorized');
    });
  });

  // ===== UpdateWarehouseUseCase =====
  describe('UpdateWarehouseUseCase', () => {
    let updateUseCase: UpdateWarehouseUseCase;

    beforeEach(() => {
      updateUseCase = new UpdateWarehouseUseCase(warehouseRepo);
    });

    it('should update a warehouse (BUSINESS_OWNER)', async () => {
      warehouseRepo.findById.mockResolvedValue(Warehouse.create({
        id: 'w1', tenantId: 'tenant1', name: 'Old Name'
      }));

      const result = await updateUseCase.execute({
        tenantId: 'tenant1',
        id: 'w1',
        name: 'New Name',
        authorRole: UserRole.BUSINESS_OWNER
      });

      expect(result.name).toBe('New Name');
    });

    it('should reject STAFF', async () => {
      await expect(updateUseCase.execute({
        tenantId: 'tenant1',
        id: 'w1',
        name: 'New Name',
        authorRole: UserRole.STAFF
      })).rejects.toThrow('Unauthorized');
    });
  });

  // ===== DeleteWarehouseUseCase =====
  describe('DeleteWarehouseUseCase', () => {
    let deleteUseCase: DeleteWarehouseUseCase;

    beforeEach(() => {
      deleteUseCase = new DeleteWarehouseUseCase(warehouseRepo, stockLevelRepo);
    });

    it('should delete a warehouse with zero stock levels (BUSINESS_OWNER)', async () => {
      warehouseRepo.findById.mockResolvedValue(Warehouse.create({
        id: 'w1', tenantId: 'tenant1', name: 'Empty Hub'
      }));
      stockLevelRepo.countByWarehouseId.mockResolvedValue(0);

      await deleteUseCase.execute({
        tenantId: 'tenant1',
        id: 'w1',
        authorRole: UserRole.BUSINESS_OWNER
      });

      expect(warehouseRepo.delete).toHaveBeenCalledWith('tenant1', 'w1');
    });

    it('should block deletion when warehouse has stock levels (WarehouseInUseError)', async () => {
      warehouseRepo.findById.mockResolvedValue(Warehouse.create({
        id: 'w1', tenantId: 'tenant1', name: 'Full Hub'
      }));
      stockLevelRepo.countByWarehouseId.mockResolvedValue(3); // Has stock

      await expect(deleteUseCase.execute({
        tenantId: 'tenant1',
        id: 'w1',
        authorRole: UserRole.BUSINESS_OWNER
      })).rejects.toThrow(WarehouseInUseError);

      // Confirm delete was NEVER called
      expect(warehouseRepo.delete).not.toHaveBeenCalled();
    });

    it('should reject STAFF', async () => {
      await expect(deleteUseCase.execute({
        tenantId: 'tenant1',
        id: 'w1',
        authorRole: UserRole.STAFF
      })).rejects.toThrow('Unauthorized');
    });

    it('should reject SUPER_ADMIN', async () => {
      await expect(deleteUseCase.execute({
        tenantId: 'tenant1',
        id: 'w1',
        authorRole: UserRole.SUPER_ADMIN
      })).rejects.toThrow('Unauthorized');
    });
  });
});
