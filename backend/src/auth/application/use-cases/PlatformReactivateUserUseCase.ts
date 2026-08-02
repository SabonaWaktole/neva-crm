import { IUserRepository } from '../../domain/repositories/IUserRepository';
import { IOwnershipTransferRepository } from '../../domain/repositories/IOwnershipTransferRepository';
import { IOwnershipTransactions } from '../ports/IOwnershipTransactions';
import { IAuditLogger } from '../../../shared/application/ports/IAuditLogger';
import { UserRole } from '../../domain/enums/UserRole';
import {
  UnauthorizedError,
  UserNotFoundError,
  CannotModifySuperAdminError,
  RestoreOwnershipChoiceRequiredError,
} from '../../domain/errors';
import { User } from '../../domain/entities/User';

export interface PlatformReactivateUserDTO {
  callerRole: string;
  callerId: string;
  userId: string;
  /**
   * Required only when the target has an unresolved ownership transfer from
   * their suspension: true restores them as owner and reverts the acting
   * owner; false keeps the acting owner and returns the target as STAFF.
   */
  restoreOwnership?: boolean;
}

/**
 * Platform Admin reactivation of any account — Business Owner or Staff.
 *
 * A plain suspension (no ownership transfer involved) is a one-step flip,
 * same shape as `SetTenantSubscriptionStatusUseCase`. A suspension that
 * promoted a staff member requires the admin to choose whether to undo that
 * or keep it — see `IOwnershipTransactions.restoreOwnership`/`keepOwnership`.
 */
export class PlatformReactivateUserUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly ownershipTransferRepository: IOwnershipTransferRepository,
    private readonly ownershipTransactions: IOwnershipTransactions,
    private readonly auditLogger: IAuditLogger
  ) {}

  async execute(dto: PlatformReactivateUserDTO): Promise<{ user: User }> {
    if (dto.callerRole !== UserRole.SUPER_ADMIN) {
      throw new UnauthorizedError('Only Super Admins can reactivate a user');
    }

    const target = await this.userRepository.findById(dto.userId);
    if (!target || target.deletedAt) {
      throw new UserNotFoundError(dto.userId);
    }
    if (target.role === UserRole.SUPER_ADMIN) {
      throw new CannotModifySuperAdminError();
    }

    // Idempotent, matching PlatformSuspendUserUseCase: already active is success.
    if (target.isActive) {
      return { user: target };
    }

    const transfer = await this.ownershipTransferRepository.findActiveByOriginalOwnerId(dto.userId);

    let ownershipResolution: 'RESTORED' | 'KEPT' | null = null;

    if (transfer) {
      if (dto.restoreOwnership === undefined) {
        throw new RestoreOwnershipChoiceRequiredError();
      }

      // The acting owner may themselves have been suspended or deleted since
      // the transfer was created — restoring is meaningless if the person
      // being restored TO no longer holds an active account to hand back.
      const actingOwner = await this.userRepository.findById(transfer.actingOwnerId);
      if (dto.restoreOwnership && (!actingOwner || actingOwner.deletedAt || !actingOwner.isActive)) {
        throw new RestoreOwnershipChoiceRequiredError();
      }

      if (dto.restoreOwnership) {
        await this.ownershipTransactions.restoreOwnership(transfer.id, dto.callerId);
        ownershipResolution = 'RESTORED';
      } else {
        await this.ownershipTransactions.keepOwnership(transfer.id, dto.callerId);
        ownershipResolution = 'KEPT';
      }
    } else {
      await this.userRepository.setActive(dto.userId, true);
    }

    await this.auditLogger.record({
      actorUserId: dto.callerId,
      actorRole: dto.callerRole,
      action: 'USER_REACTIVATED',
      targetType: 'USER',
      targetId: dto.userId,
      tenantId: target.tenantId,
      metadata: {
        targetEmail: target.email,
        ...(ownershipResolution ? { ownershipTransferId: transfer!.id, resolution: ownershipResolution } : {}),
      },
    });

    const updated = await this.userRepository.findById(dto.userId);
    if (!updated) {
      throw new UserNotFoundError(dto.userId);
    }
    return { user: updated };
  }
}
