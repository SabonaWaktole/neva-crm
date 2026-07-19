import { IWarehouseRepository } from '../../domain/repositories';
import { Warehouse } from '../../domain/Warehouse';
import { UserRole } from '../../../auth/domain/enums/UserRole';

export interface GetWarehousesRequest {
  tenantId: string;
  authorRole: UserRole;
}

export class GetWarehousesUseCase {
  constructor(private warehouseRepository: IWarehouseRepository) {}

  async execute(request: GetWarehousesRequest): Promise<Warehouse[]> {
    if (request.authorRole !== UserRole.BUSINESS_OWNER && request.authorRole !== UserRole.STAFF) {
      throw new Error('Unauthorized: Only Business Owners and Staff can view warehouses.');
    }

    return this.warehouseRepository.findAllByTenantId(request.tenantId);
  }
}
