import { IWarehouseRepository } from '../../domain/repositories';
import { Warehouse } from '../../domain/Warehouse';
import { UserRole } from '../../../auth/domain/enums/UserRole';

export interface UpdateWarehouseDTO {
  tenantId: string;
  id: string;
  name?: string;
  address?: string | null;
  authorRole: UserRole;
}

export class UpdateWarehouseUseCase {
  constructor(private warehouseRepo: IWarehouseRepository) {}

  async execute(dto: UpdateWarehouseDTO): Promise<Warehouse> {
    if (dto.authorRole !== UserRole.BUSINESS_OWNER) {
      throw new Error('Unauthorized: Only Business Owners can manage warehouses.');
    }

    const warehouse = await this.warehouseRepo.findById(dto.tenantId, dto.id);
    if (!warehouse) {
      throw new Error(`Warehouse ${dto.id} not found`);
    }

    warehouse.update({ name: dto.name, address: dto.address });
    await this.warehouseRepo.update(warehouse);
    return warehouse;
  }
}
