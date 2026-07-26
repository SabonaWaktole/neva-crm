import { IUserRepository } from '../../domain/repositories/IUserRepository';
import { ITenantRepository } from '../../../tenant/domain/repositories/ITenantRepository';
import { IPasswordHasher } from '../ports/IPasswordHasher';
import { ITokenService } from '../ports/ITokenService';
import { InvalidCredentialsError } from '../../domain/errors';
import { UserRole } from '../../domain/enums/UserRole';

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

    if (input.tenantSlug === null) {
      user = await this.userRepository.findAnyByEmail(input.email);
      if (user && user.role !== UserRole.SUPER_ADMIN && user.tenantId) {
        const tenant = await this.tenantRepository.findById(user.tenantId);
        if (tenant) {
          actualTenantSlug = tenant.urlSlug;
        }
      }
    } else {
      const tenant = await this.tenantRepository.findBySlug(input.tenantSlug);
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
