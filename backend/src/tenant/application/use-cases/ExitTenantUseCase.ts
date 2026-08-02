import { IUserRepository } from '../../../auth/domain/repositories/IUserRepository';
import { ITokenService } from '../../../auth/application/ports/ITokenService';
import { UserRole } from '../../../auth/domain/enums/UserRole';
import { UnauthorizedError } from '../../../auth/domain/errors';

/**
 * The return leg of `EnterTenantUseCase`: swaps a workspace session back for a
 * plain platform session.
 *
 * The caller's token reads `role: BUSINESS_OWNER`, so this cannot be guarded by
 * role. What authorises it is the `impersonatorId` claim — a claim only
 * `EnterTenantUseCase` ever sets, on a token this service signed. That is also
 * why the route lives on the global auth router rather than under the
 * SUPER_ADMIN-only tenant router, which the caller would now fail to enter.
 *
 * The administrator is re-read and re-checked before a platform token is
 * issued, so a session entered before the account was deactivated or demoted
 * cannot be exchanged for platform access afterwards.
 */
export class ExitTenantUseCase {
  constructor(
    private userRepository: IUserRepository,
    private tokenService: ITokenService
  ) {}

  async execute(input: { impersonatorId?: string }) {
    if (!input.impersonatorId) {
      throw new UnauthorizedError('Not currently managing a workspace');
    }

    const admin = await this.userRepository.findById(input.impersonatorId);
    if (!admin || !admin.isActive || admin.role !== UserRole.SUPER_ADMIN) {
      throw new UnauthorizedError('Platform administrator account is no longer available');
    }

    // A plain platform token: no tenant, no impersonation claims. Identical in
    // shape to what a normal SUPER_ADMIN login produces.
    const token = this.tokenService.sign({
      userId: admin.id,
      role: UserRole.SUPER_ADMIN,
      tenantId: null,
      tenantSlug: null,
      warehouseId: null,
    });

    return { token };
  }
}
