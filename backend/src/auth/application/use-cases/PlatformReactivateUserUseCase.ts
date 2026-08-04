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

/**
 * What to do with the temporary Business Owner promoted at suspension time.
 *
 * `KEEP_BOTH` is the one resolution that demotes nobody: a business may have
 * any number of Business Owners, so restoring the original does not have to
 * cost the stand-in their role.
 */
export const OwnershipResolution = {
  /** Original owner returns; the acting owner reverts to their former role. */
  RESTORE: 'RESTORE',
  /** Acting owner stays; the original owner returns as STAFF. */
  KEEP: 'KEEP',
  /** Both stay Business Owners of the workspace. */
  KEEP_BOTH: 'KEEP_BOTH',
} as const;

export type OwnershipResolution = (typeof OwnershipResolution)[keyof typeof OwnershipResolution];

export interface PlatformReactivateUserDTO {
  callerRole: string;
  callerId: string;
  userId: string;
  /**
   * Required only when the target has an unresolved ownership transfer from
   * their suspension. See `OwnershipResolution` for what each choice does.
   */
  ownershipResolution?: OwnershipResolution;
}

/**
 * Platform Admin reactivation of any account — Business Owner or Staff.
 *
 * A plain suspension (no ownership transfer involved) is a one-step flip,
 * same shape as `SetTenantSubscriptionStatusUseCase`. A suspension that
 * promoted a staff member requires the admin to choose between the three
 * `OwnershipResolution`s — see `IOwnershipTransactions.restoreOwnership` /
 * `keepOwnership` / `keepBothOwners`.
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

    let resolution: OwnershipResolution | null = null;

    if (transfer) {
      if (dto.ownershipResolution === undefined) {
        throw new RestoreOwnershipChoiceRequiredError();
      }
      resolution = dto.ownershipResolution;

      // The acting owner may themselves have been suspended or deleted since
      // the transfer was created. Both resolutions that say something about
      // what happens to THEM — reverting them, or leaving them in place
      // alongside the original owner — are meaningless without an active
      // account on the other side; KEEP is not, since it only demotes the
      // person being reactivated.
      const actingOwner = await this.userRepository.findById(transfer.actingOwnerId);
      const actingOwnerIsActive = Boolean(actingOwner && !actingOwner.deletedAt && actingOwner.isActive);
      if (resolution !== OwnershipResolution.KEEP && !actingOwnerIsActive) {
        throw new RestoreOwnershipChoiceRequiredError();
      }

      if (resolution === OwnershipResolution.RESTORE) {
        await this.ownershipTransactions.restoreOwnership(transfer.id, dto.callerId);
      } else if (resolution === OwnershipResolution.KEEP_BOTH) {
        await this.ownershipTransactions.keepBothOwners(transfer.id, dto.callerId);
      } else {
        await this.ownershipTransactions.keepOwnership(transfer.id, dto.callerId);
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
        ...(resolution ? { ownershipTransferId: transfer!.id, resolution } : {}),
      },
    });

    const updated = await this.userRepository.findById(dto.userId);
    if (!updated) {
      throw new UserNotFoundError(dto.userId);
    }
    return { user: updated };
  }
}
