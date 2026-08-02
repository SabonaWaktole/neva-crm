import { ITenantRepository } from '../../domain/repositories/ITenantRepository';
import { TenantNotFoundError, TenantSuspendedError } from '../../domain/errors';
import { IUserRepository } from '../../../auth/domain/repositories/IUserRepository';
import { ITokenService } from '../../../auth/application/ports/ITokenService';
import { UserRole } from '../../../auth/domain/enums/UserRole';
import { UnauthorizedError } from '../../../auth/domain/errors';

/**
 * Lets a SUPER_ADMIN step into a workspace and administer it as its owner.
 *
 * The mechanism is a session swap, not an exemption: a new token is minted with
 * the target workspace's tenantId/tenantSlug and `role: BUSINESS_OWNER`. This is
 * the whole reason `resolveTenant`'s cross-tenant rule needs no change — the
 * caller genuinely is, for the life of that token, scoped to exactly one
 * workspace, and reaching a second one still 403s. Widening that middleware
 * instead would have re-introduced the null-tenantId dereferences it documents.
 *
 * `userId` remains the administrator's own, so their writes land in
 * `createdByUserId` / `assignedUserId` under their identity, not a client's.
 */
export class EnterTenantUseCase {
  constructor(
    private tenantRepository: ITenantRepository,
    private userRepository: IUserRepository,
    private tokenService: ITokenService
  ) {}

  async execute(input: { callerUserId: string; callerRole: string; tenantId: string }) {
    if (input.callerRole !== UserRole.SUPER_ADMIN) {
      throw new UnauthorizedError('Only platform administrators can manage a workspace');
    }

    const admin = await this.userRepository.findById(input.callerUserId);
    // Re-read rather than trusting the token: `authenticate` never touches the
    // database, so a deactivated or demoted administrator would otherwise keep
    // minting workspace sessions until their token expired (TD-010). This is
    // the point where that costs one query and is worth it.
    if (!admin || !admin.isActive || admin.role !== UserRole.SUPER_ADMIN) {
      throw new UnauthorizedError('Only platform administrators can manage a workspace');
    }

    const tenant = await this.tenantRepository.findById(input.tenantId);
    if (!tenant) {
      throw new TenantNotFoundError(input.tenantId);
    }

    // A suspended workspace serves nothing to anyone — the same rule
    // `resolveTenant` applies. Entering one would mint a session that 403s on
    // its very first data request, which reads as a broken app rather than as a
    // suspended workspace. Reactivate first, then enter.
    if (tenant.isSuspended()) {
      throw new TenantSuspendedError();
    }

    const token = this.tokenService.sign({
      userId: admin.id,
      role: UserRole.BUSINESS_OWNER,
      tenantId: tenant.id,
      tenantSlug: tenant.urlSlug,
      // No warehouse: a platform administrator has no home warehouse in a
      // workspace they are visiting, and null is what an unrestricted owner
      // carries anyway.
      warehouseId: null,
      impersonatorId: admin.id,
      impersonatorEmail: admin.email,
    });

    return {
      token,
      tenantSlug: tenant.urlSlug,
      tenantName: tenant.name,
    };
  }
}
