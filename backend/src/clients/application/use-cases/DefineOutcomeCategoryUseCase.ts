import { IOutcomeCategoryRepository } from '../../domain/repositories/IOutcomeCategoryRepository';
import { OutcomeCategory } from '../../domain/entities/OutcomeCategory';
import { UserRole } from '../../../auth/domain/enums/UserRole';
import { DomainError } from '../../../shared/domain/errors/DomainError';
import { randomUUID } from 'crypto';

interface DefineOutcomeCategoryDTO {
  tenantId: string;
  requestingUserRole: string;
  label: string;
}

export class DefineOutcomeCategoryUseCase {
  constructor(private outcomeRepo: IOutcomeCategoryRepository) {}

  async execute(dto: DefineOutcomeCategoryDTO): Promise<OutcomeCategory> {
    if (dto.requestingUserRole !== UserRole.BUSINESS_OWNER && dto.requestingUserRole !== UserRole.SUPER_ADMIN) {
      throw new DomainError('Only Business Owners can define outcome categories');
    }

    const category = OutcomeCategory.create({
      id: randomUUID(),
      tenantId: dto.tenantId,
      label: dto.label,
    });

    await this.outcomeRepo.save(dto.tenantId, category);
    return category;
  }
}
