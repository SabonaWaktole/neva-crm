import { IUserRepository } from '../../domain/repositories/IUserRepository';
import { UserRole } from '../../domain/enums/UserRole';
import { UnauthorizedError, UserNotFoundError, CannotModifySuperAdminError } from '../../domain/errors';
import { otherActiveOwners } from '../../domain/services/ownership';

export interface GetOwnershipTransferCandidatesDTO {
  callerRole: string;
  /** The Business Owner being suspended or deleted, not the candidates. */
  userId: string;
}

/**
 * Active staff eligible to become the new Business Owner, shown to the
 * Platform Admin BEFORE they suspend or delete the last owner of a workspace
 * that has a team — `SuspendUserUseCase`/`DeleteUserUseCase` re-validate the
 * choice themselves, this is only the picker's data source.
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

    // Empty whenever the workspace keeps another active Business Owner: the
    // suspend/delete use cases require no handover in that case, and offering
    // a picker the server would ignore is how a console starts asking for
    // decisions that do not exist. Same condition, one definition —
    // `otherActiveOwners`.
    const owners = await this.userRepository.findActiveByTenantAndRole(
      target.tenantId,
      UserRole.BUSINESS_OWNER
    );
    if (otherActiveOwners(owners, target.id).length > 0) {
      return [];
    }

    const staff = await this.userRepository.findActiveByTenantAndRole(target.tenantId, UserRole.STAFF);
    return staff.filter((s) => s.id !== target.id);
  }
}
