import { CustomFieldDefinition } from '../entities/CustomFieldDefinition';

export interface ICustomFieldDefinitionRepository {
  findByTenantId(tenantId: string): Promise<CustomFieldDefinition[]>;
  save(tenantId: string, definition: CustomFieldDefinition): Promise<void>;
}
