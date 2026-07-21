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
        role: u.role,
      }))
    };
  }
}
