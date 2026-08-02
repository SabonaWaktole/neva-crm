import { IUserRepository } from '../../domain/repositories/IUserRepository';
import { UserRole } from '../../domain/enums/UserRole';
import { UnauthorizedError, UserNotFoundError, CannotModifySuperAdminError } from '../../domain/errors';

export interface GetOwnershipTransferCandidatesDTO {
  callerRole: string;
  /** The Business Owner being suspended or deleted, not the candidates. */
  userId: string;
}

/**
 * Active staff eligible to become the new Business Owner, shown to the
 * Platform Admin BEFORE they suspend or delete an owner who has a team —
 * `SuspendUserUseCase`/`DeleteUserUseCase` re-validate the choice themselves,
 * this is only the picker's data source.
 */
export class GetOwnershipTransferCandidatesUseCase {
  constructor(private userRepository: IUserRepository) {}

  async execute(dto: GetOwnershipTransferCandidatesDTO) {
    if (dto.callerRole !== UserRole.SUPER_ADMIN) {
      throw new UnauthorizedError('Only platform administrators can view ownership transfer candidates');
    }

    const target = await this.userRepository.findById(dto.userId);
    if (!target || target.deletedAt) {
      throw new UserNotFoundError(dto.userId);
    }
    if (target.role === UserRole.SUPER_ADMIN) {
      throw new CannotModifySuperAdminError();
    }
    if (!target.tenantId) {
      return [];
    }

    const staff = await this.userRepository.findActiveByTenantAndRole(target.tenantId, UserRole.STAFF);
    return staff.filter((s) => s.id !== target.id);
  }
}
