import { IUserRepository } from '../../domain/repositories/IUserRepository';
import { UserRole } from '../../domain/enums/UserRole';
import { UnauthorizedError } from '../../domain/errors';

export interface GetDeactivationImpactDTO {
  requestingUserRole: string;
  tenantId: string;
  userId: string;
}

/**
 * What would be left unattended if this user were deactivated.
 *
 * Read by the confirmation dialog so the decision is made with the consequence
 * visible, rather than discovered afterwards.
 */
export class GetDeactivationImpactUseCase {
  constructor(private userRepository: IUserRepository) {}

  async execute(dto: GetDeactivationImpactDTO): Promise<{ clients: number; upcomingAppointments: number }> {
    if (dto.requestingUserRole !== UserRole.BUSINESS_OWNER) {
      throw new UnauthorizedError('Only Business Owners can view deactivation impact.');
    }

    const target = await this.userRepository.findById(dto.userId);
    if (!target || target.tenantId !== dto.tenantId) {
      throw new Error('User not found.');
    }

    return this.userRepository.countAssignedWork(dto.userId);
  }
}
