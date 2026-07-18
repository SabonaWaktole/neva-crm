import { ICustomFieldDefinitionRepository } from '../../domain/repositories/ICustomFieldDefinitionRepository';
import { CustomFieldDefinition } from '../../domain/entities/CustomFieldDefinition';
import { FieldType } from '../../domain/enums/FieldType';
import { UserRole } from '../../../auth/domain/enums/UserRole';
import { DomainError } from '../../../shared/domain/errors/DomainError';
import { randomUUID } from 'crypto';

interface DefineCustomFieldDTO {
  tenantId: string;
  requestingUserRole: string;
  fieldName: string;
  fieldType: FieldType;
  options?: string[];
}

export class DefineCustomFieldUseCase {
  constructor(private customFieldRepo: ICustomFieldDefinitionRepository) {}

  async execute(dto: DefineCustomFieldDTO): Promise<CustomFieldDefinition> {
    if (dto.requestingUserRole !== UserRole.BUSINESS_OWNER && dto.requestingUserRole !== UserRole.SUPER_ADMIN) {
      throw new DomainError('Only Business Owners can define custom fields');
    }

    const definition = CustomFieldDefinition.create({
      id: randomUUID(),
      tenantId: dto.tenantId,
      fieldName: dto.fieldName,
      fieldType: dto.fieldType,
      options: dto.options,
    });

    await this.customFieldRepo.save(dto.tenantId, definition);
    return definition;
  }
}
