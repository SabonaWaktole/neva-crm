import { IWarehouseRepository } from '../../domain/repositories';
import { Warehouse } from '../../domain/Warehouse';
import { UserRole } from '../../../auth/domain/enums/UserRole';

export interface GetWarehousesRequest {
  tenantId: string;
  authorRole: UserRole;
  authorWarehouseId?: string | null;
}

export class GetWarehousesUseCase {
  constructor(private warehouseRepository: IWarehouseRepository) {}

  async execute(request: GetWarehousesRequest): Promise<Warehouse[]> {
    if (request.authorRole !== UserRole.BUSINESS_OWNER && request.authorRole !== UserRole.STAFF && request.authorRole !== UserRole.SUPER_ADMIN) {
      throw new Error('Unauthorized: Only Business Owners and Staff can view warehouses.');
    }

    const allWarehouses = await this.warehouseRepository.findAllByTenantId(request.tenantId);

    if (request.authorRole === UserRole.STAFF) {
      if (!request.authorWarehouseId) {
        return [];
      }
      return allWarehouses.filter(w => w.id === request.authorWarehouseId);
    }

    return allWarehouses;
  }
}
