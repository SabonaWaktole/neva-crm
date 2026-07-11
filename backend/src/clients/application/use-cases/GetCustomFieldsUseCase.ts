import { ICustomFieldDefinitionRepository } from '../../domain/repositories/ICustomFieldDefinitionRepository';
import { CustomFieldDefinition } from '../../domain/entities/CustomFieldDefinition';

export class GetCustomFieldsUseCase {
  constructor(private customFieldRepo: ICustomFieldDefinitionRepository) {}

  async execute(tenantId: string): Promise<CustomFieldDefinition[]> {
    return this.customFieldRepo.findByTenantId(tenantId);
  }
}
