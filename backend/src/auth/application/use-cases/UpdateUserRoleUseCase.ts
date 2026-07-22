import { IUserRepository } from '../../domain/repositories/IUserRepository';
import { UserRole } from '../../domain/enums/UserRole';
import { UnauthorizedError } from '../../domain/errors';

export class UpdateUserRoleUseCase {
  constructor(private userRepository: IUserRepository) {}

  async execute(input: {
    invitingUserRole: UserRole;
    tenantId: string;
    userIdToUpdate: string;
    newRole: UserRole;
    newWarehouseId: string | null;
  }) {
    if (input.invitingUserRole !== UserRole.BUSINESS_OWNER && input.invitingUserRole !== UserRole.SUPER_ADMIN) {
      throw new UnauthorizedError('Only Business Owners can update staff roles');
    }

    const userToUpdate = await this.userRepository.findById(input.userIdToUpdate);
    if (!userToUpdate) {
      throw new Error('User not found');
    }

    if (userToUpdate.tenantId !== input.tenantId) {
      throw new UnauthorizedError('User does not belong to this tenant');
    }

    await this.userRepository.updateRoleAndWarehouse(
      input.userIdToUpdate,
      input.newRole,
      input.newWarehouseId
    );

    return { success: true };
  }
}
