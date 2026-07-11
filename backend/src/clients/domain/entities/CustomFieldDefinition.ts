import { FieldType } from '../enums/FieldType';
import { DomainError } from '../../../shared/domain/errors/DomainError';

export interface CustomFieldDefinitionProps {
  id: string;
  tenantId: string;
  fieldName: string;
  fieldType: FieldType;
  options?: string[];
}

export class CustomFieldDefinition {
  public readonly id: string;
  public readonly tenantId: string;
  public readonly fieldName: string;
  public readonly fieldType: FieldType;
  public readonly options?: string[];

  private constructor(props: CustomFieldDefinitionProps) {
    this.id = props.id;
    this.tenantId = props.tenantId;
    this.fieldName = props.fieldName;
    this.fieldType = props.fieldType;
    this.options = props.options;
  }

  public static create(props: CustomFieldDefinitionProps): CustomFieldDefinition {
    if (props.fieldType === FieldType.SINGLE_SELECT) {
      if (!props.options || props.options.length === 0) {
        throw new DomainError('SINGLE_SELECT fields must have at least one option.');
      }
    }

    return new CustomFieldDefinition(props);
  }
}
