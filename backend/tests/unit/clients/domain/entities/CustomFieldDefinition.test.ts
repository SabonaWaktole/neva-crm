import { CustomFieldDefinition } from '../../../../../src/clients/domain/entities/CustomFieldDefinition';
import { FieldType } from '../../../../../src/clients/domain/enums/FieldType';

describe('CustomFieldDefinition Entity', () => {
  it('creates a TEXT field definition', () => {
    const def = CustomFieldDefinition.create({
      id: 'field-1',
      tenantId: 'tenant-123',
      fieldName: 'industry',
      fieldType: FieldType.TEXT,
    });
    expect(def.id).toBe('field-1');
    expect(def.fieldName).toBe('industry');
    expect(def.fieldType).toBe(FieldType.TEXT);
    expect(def.options).toBeUndefined();
  });

  it('creates a SINGLE_SELECT field definition with options', () => {
    const def = CustomFieldDefinition.create({
      id: 'field-2',
      tenantId: 'tenant-123',
      fieldName: 'status',
      fieldType: FieldType.SINGLE_SELECT,
      options: ['A', 'B'],
    });
    expect(def.fieldType).toBe(FieldType.SINGLE_SELECT);
    expect(def.options).toEqual(['A', 'B']);
  });

  it('rejects SINGLE_SELECT creation if options are missing or empty', () => {
    expect(() => {
      CustomFieldDefinition.create({
        id: 'field-3',
        tenantId: 'tenant-123',
        fieldName: 'status',
        fieldType: FieldType.SINGLE_SELECT,
        options: [],
      });
    }).toThrow('SINGLE_SELECT fields must have at least one option.');
    
    expect(() => {
      CustomFieldDefinition.create({
        id: 'field-3',
        tenantId: 'tenant-123',
        fieldName: 'status',
        fieldType: FieldType.SINGLE_SELECT,
      });
    }).toThrow('SINGLE_SELECT fields must have at least one option.');
  });
});
