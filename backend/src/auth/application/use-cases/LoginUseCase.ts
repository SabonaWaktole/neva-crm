import { IUserRepository } from '../../domain/repositories/IUserRepository';
import { ITenantRepository } from '../../../tenant/domain/repositories/ITenantRepository';
import { IPasswordHasher } from '../ports/IPasswordHasher';
import { ITokenService } from '../ports/ITokenService';
import { InvalidCredentialsError } from '../../domain/errors';
import { TenantSuspendedError } from '../../../tenant/domain/errors';
import { UserRole } from '../../domain/enums/UserRole';
import { Tenant } from '../../../tenant/domain/entities/Tenant';

export class LoginUseCase {
  constructor(
    private userRepository: IUserRepository,
    private tenantRepository: ITenantRepository,
    private passwordHasher: IPasswordHasher,
    private tokenService: ITokenService
  ) {}

  async execute(input: any) {
    let user;
    let actualTenantSlug = input.tenantSlug;

    /*
     * The tenant this login is against, carried down to the suspension check
     * below. Both branches already load it, so enforcing suspension here costs
     * no extra query.
     *
     * Stays null for a SUPER_ADMIN, who belongs to no tenant. A platform
     * administrator must never be locked out by a tenant's status — they are
     * the only role that can lift a suspension.
     */
    let tenant: Tenant | null = null;

    if (input.tenantSlug === null) {
      user = await this.userRepository.findAnyByEmail(input.email);
      if (user && user.role !== UserRole.SUPER_ADMIN && user.tenantId) {
        tenant = await this.tenantRepository.findById(user.tenantId);
        if (tenant) {
          actualTenantSlug = tenant.urlSlug;
        }
      }
    } else {
      tenant = await this.tenantRepository.findBySlug(input.tenantSlug);
      if (!tenant) throw new InvalidCredentialsError();

      user = await this.userRepository.findByEmail(input.email, tenant.id);
      if (user && user.role === UserRole.SUPER_ADMIN) {
        throw new InvalidCredentialsError();
      }
    }

    if (!user) {
      throw new InvalidCredentialsError();
    }

    const isValid = await this.passwordHasher.compare(input.password, user.hashedPassword);
    if (!isValid) {
      throw new InvalidCredentialsError();
    }

    // Deactivated accounts cannot obtain a new token. The same generic error is
    // used as for a wrong password: telling an unauthenticated caller that an
    // account exists but is disabled leaks account state.
    if (!user.isActive) {
      throw new InvalidCredentialsError();
    }

    /*
     * Suspended workspace: no token is issued.
     *
     * Checked AFTER the password and isActive checks on purpose. Placing it
     * earlier would let anyone who can guess a slug probe whether a workspace
     * is suspended without presenting any credentials at all. Here, only
     * someone who has just proved they hold a valid account learns it — and
     * they are precisely the person entitled to know.
     *
     * Unlike the two checks above, this one names the reason rather than
     * returning the generic invalid-credentials error. See TenantSuspendedError
     * for why the usual anti-enumeration argument does not apply.
     */
    if (tenant?.isSuspended()) {
      throw new TenantSuspendedError();
    }

    const token = this.tokenService.sign({
      userId: user.id,
      role: user.role,
      tenantId: user.tenantId,
      tenantSlug: actualTenantSlug,
      warehouseId: user.warehouseId,
    });

    return { token, tenantSlug: actualTenantSlug };
  }
}
