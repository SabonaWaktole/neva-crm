import { IWarehouseRepository } from '../../domain/repositories';
import { Warehouse } from '../../domain/Warehouse';
import { UserRole } from '../../../auth/domain/enums/UserRole';
import { randomUUID } from 'crypto';

export interface CreateWarehouseDTO {
  tenantId: string;
  name: string;
  address?: string;
  authorRole: UserRole;
}

export class CreateWarehouseUseCase {
  constructor(private warehouseRepo: IWarehouseRepository) {}

  async execute(dto: CreateWarehouseDTO): Promise<Warehouse> {
    if (dto.authorRole !== UserRole.BUSINESS_OWNER) {
      throw new Error('Unauthorized: Only Business Owners can manage warehouses.');
    }

    const warehouse = Warehouse.create({
      id: randomUUID(),
      tenantId: dto.tenantId,
      name: dto.name,
      address: dto.address,
    });

    await this.warehouseRepo.save(warehouse);
    return warehouse;
  }
}
