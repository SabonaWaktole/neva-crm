import { IUserRepository, PlatformUserFilters } from '../../domain/repositories/IUserRepository';
import { UserRole } from '../../domain/enums/UserRole';
import { UnauthorizedError } from '../../domain/errors';

/**
 * Every account on the platform, for the SUPER_ADMIN people console.
 *
 * This is the only read in the application that crosses workspace boundaries by
 * design. The route it sits behind is already `authorize([SUPER_ADMIN])`; the
 * role is re-checked here so the guarantee does not live solely in a router
 * that someone could later remount, matching how the other privileged use cases
 * in this module behave.
 */
export class GetPlatformUsersUseCase {
  private static readonly MAX_TAKE = 100;

  constructor(private userRepository: IUserRepository) {}

  async execute(input: { callerRole: string } & PlatformUserFilters) {
    if (input.callerRole !== UserRole.SUPER_ADMIN) {
      throw new UnauthorizedError('Only platform administrators can list users across workspaces');
    }

    // Capped so a hand-crafted `take` cannot pull every account on the platform
    // in one response.
    const take = Math.min(input.take ?? 50, GetPlatformUsersUseCase.MAX_TAKE);

    return this.userRepository.findPlatformUsers({
      tenantId: input.tenantId,
      role: input.role,
      isActive: input.isActive,
      q: input.q,
      skip: input.skip ?? 0,
      take,
    });
  }
}
