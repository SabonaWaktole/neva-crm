import { IUserRepository } from '../../domain/repositories/IUserRepository';
import { UserRole } from '../../domain/enums/UserRole';

export class GetTenantStaffUseCase {
  constructor(private userRepository: IUserRepository) {}

  async execute(params: { tenantId: string }) {
    if (!params.tenantId) {
      throw new Error('Tenant ID is required');
    }

    const users = await this.userRepository.findByTenantId(params.tenantId);

    return {
      items: users.map(u => ({
        id: u.id,
        email: u.email,
        // Names are needed to render a person anywhere a userId is stored —
        // the assignee selector, and the Team Settings list, which was already
        // rendering `firstName lastName` into a blank line because this
        // projection dropped them.
        firstName: u.firstName,
        lastName: u.lastName,
        role: u.role,
        warehouseId: u.warehouseId,
      }))
    };
  }
}
