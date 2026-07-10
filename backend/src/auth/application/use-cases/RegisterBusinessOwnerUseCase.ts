import { IUserRepository } from '../../domain/repositories/IUserRepository';
import { ITenantRepository } from '../../../tenant/domain/repositories/ITenantRepository';
import { IPasswordHasher } from '../ports/IPasswordHasher';
import { IUnitOfWork } from '../../../shared/application/ports/IUnitOfWork';
import { UserRole } from '../../domain/enums/UserRole';
import { Email } from '../../domain/value-objects/Email';
import { Password } from '../../domain/value-objects/Password';
import { Tenant } from '../../../tenant/domain/entities/Tenant';
import { User } from '../../domain/entities/User';
import { SlugAlreadyTakenError } from '../../domain/errors';
import { v4 as uuidv4 } from 'uuid';

export class RegisterBusinessOwnerUseCase {
  constructor(
    private userRepository: IUserRepository,
    private tenantRepository: ITenantRepository,
    private passwordHasher: IPasswordHasher,
    private unitOfWork: IUnitOfWork
  ) {}

  async execute(input: any) {
    const email = new Email(input.ownerEmail);
    const password = new Password(input.ownerPassword);

    const existingTenant = await this.tenantRepository.findBySlug(input.urlSlug);
    if (existingTenant) {
      throw new SlugAlreadyTakenError(input.urlSlug);
    }

    const hashedPassword = await this.passwordHasher.hash(password.value);

    return await this.unitOfWork.execute(async () => {
      const tenant = Tenant.create({
        id: uuidv4(),
        name: input.companyName,
        urlSlug: input.urlSlug,
        createdAt: new Date(),
      });
      await this.tenantRepository.create(tenant);

      const user = User.create({
        id: uuidv4(),
        email: email.value,
        hashedPassword,
        role: UserRole.BUSINESS_OWNER,
        tenantId: tenant.id,
        createdAt: new Date(),
      });
      await this.userRepository.create(user);

      return { tenant, user };
    });
  }
}
