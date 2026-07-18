import { IWarehouseRepository, IStockLevelRepository } from '../../domain/repositories';
import { UserRole } from '../../../auth/domain/enums/UserRole';
import { WarehouseInUseError } from '../../domain/inUseErrors';

export interface DeleteWarehouseDTO {
  tenantId: string;
  id: string;
  authorRole: UserRole;
}

export class DeleteWarehouseUseCase {
  constructor(
    private warehouseRepo: IWarehouseRepository,
    private stockLevelRepo: IStockLevelRepository
  ) {}

  async execute(dto: DeleteWarehouseDTO): Promise<void> {
    if (dto.authorRole !== UserRole.BUSINESS_OWNER) {
      throw new Error('Unauthorized: Only Business Owners can manage warehouses.');
    }

    const warehouse = await this.warehouseRepo.findById(dto.tenantId, dto.id);
    if (!warehouse) {
      throw new Error(`Warehouse ${dto.id} not found`);
    }

    // Block deletion if warehouse has any stock levels
    const stockCount = await this.stockLevelRepo.countByWarehouseId(dto.tenantId, dto.id);
    if (stockCount > 0) {
      throw new WarehouseInUseError(dto.id);
    }

    await this.warehouseRepo.delete(dto.tenantId, dto.id);
  }
}
