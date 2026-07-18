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

    if (input.tenantSlug === null) {
      user = await this.userRepository.findSuperAdminByEmail(input.email);
      if (user && user.role !== UserRole.SUPER_ADMIN) {
        throw new InvalidCredentialsError();
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

    const token = this.tokenService.sign({
      userId: user.id,
      role: user.role,
      tenantId: user.tenantId,
      tenantSlug: input.tenantSlug,
    });

    return { token };
  }
}
