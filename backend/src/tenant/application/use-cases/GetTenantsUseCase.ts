import { ITenantRepository } from '../../domain/repositories/ITenantRepository';
import { UnauthorizedError } from '../../../auth/domain/errors';
import { UserRole } from '../../../auth/domain/enums/UserRole';

export interface GetTenantsDTO {
  callerRole: string;
  skip?: number;
  take?: number;
}

export class GetTenantsUseCase {
  constructor(private tenantRepo: ITenantRepository) {}

  async execute(dto: GetTenantsDTO) {
    if (dto.callerRole !== UserRole.SUPER_ADMIN) {
      throw new UnauthorizedError('Only Super Admins can access tenant lists');
    }

    const skip = dto.skip ?? 0;
    const take = dto.take ?? 50;

    const result = await this.tenantRepo.findAll(skip, take);
    return result;
  }
}
