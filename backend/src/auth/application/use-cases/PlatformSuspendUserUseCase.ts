import { IUserRepository } from '../../domain/repositories/IUserRepository';
import { IOwnershipTransactions } from '../ports/IOwnershipTransactions';
import { IAuditLogger } from '../../../shared/application/ports/IAuditLogger';
import { UserRole } from '../../domain/enums/UserRole';
import {
  UnauthorizedError,
  UserNotFoundError,
  CannotModifySuperAdminError,
  OwnershipTransferRequiredError,
  InvalidOwnershipTargetError,
} from '../../domain/errors';
import { User } from '../../domain/entities/User';

export interface PlatformSuspendUserDTO {
  callerRole: string;
  callerId: string;
  userId: string;
  /** Required only when the target is a Business Owner with other active staff. */
  newOwnerId?: string;
}

/**
 * Platform Admin suspension of any account — Business Owner or Staff.
 *
 * Distinct from `DeactivateUserUseCase`: that one is a Business Owner
 * off-boarding their own staff and explicitly refuses to touch a Business
 * Owner at all. This one is the platform administrator, who may suspend
 * either role, and who — when suspending the sole owner of a workspace that
 * still has staff — must first hand the workspace to one of them so it
 * remains manageable while the owner is out. See `IOwnershipTransactions`.
 *
 * Reversible, unlike `PlatformDeleteUserUseCase`: reactivation
 * (`PlatformReactivateUserUseCase`) can always undo this, ownership transfer
 * included.
 */
export class PlatformSuspendUserUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly ownershipTransactions: IOwnershipTransactions,
    private readonly auditLogger: IAuditLogger
  ) {}

  async execute(dto: PlatformSuspendUserDTO): Promise<{ user: User }> {
    if (dto.callerRole !== UserRole.SUPER_ADMIN) {
      throw new UnauthorizedError('Only Super Admins can suspend a user');
    }

    const target = await this.userRepository.findById(dto.userId);
    if (!target || target.deletedAt) {
      throw new UserNotFoundError(dto.userId);
    }
    if (target.role === UserRole.SUPER_ADMIN) {
      throw new CannotModifySuperAdminError();
    }

    // Idempotent, same convention as SetTenantSubscriptionStatusUseCase: a
    // retry or double-click on an already-suspended user is a success, not
    // an error.
    if (!target.isActive) {
      return { user: target };
    }

    let ownershipTransferId: string | null = null;

    if (target.role === UserRole.BUSINESS_OWNER && target.tenantId) {
      const staff = await this.userRepository.findActiveByTenantAndRole(target.tenantId, UserRole.STAFF);

      if (staff.length > 0) {
        if (!dto.newOwnerId) {
          throw new OwnershipTransferRequiredError();
        }
        const actingOwner = staff.find((s) => s.id === dto.newOwnerId);
        if (!actingOwner) {
          throw new InvalidOwnershipTargetError();
        }

        const transfer = await this.ownershipTransactions.promoteForSuspension({
          id: crypto.randomUUID(),
          tenantId: target.tenantId,
          originalOwnerId: target.id,
          actingOwnerId: actingOwner.id,
          actingOwnerRole: actingOwner.role,
          actingOwnerWarehouseId: actingOwner.warehouseId,
          createdByUserId: dto.callerId,
        });
        ownershipTransferId = transfer.id;
      } else {
        await this.userRepository.setActive(dto.userId, false);
      }
    } else {
      await this.userRepository.setActive(dto.userId, false);
    }

    await this.auditLogger.record({
      actorUserId: dto.callerId,
      actorRole: dto.callerRole,
      action: 'USER_SUSPENDED',
      targetType: 'USER',
      targetId: dto.userId,
      tenantId: target.tenantId,
      metadata: {
        targetEmail: target.email,
        ...(ownershipTransferId ? { ownershipTransferId, newOwnerId: dto.newOwnerId } : {}),
      },
    });

    const updated = await this.userRepository.findById(dto.userId);
    if (!updated) {
      throw new UserNotFoundError(dto.userId);
    }
    return { user: updated };
  }
}
