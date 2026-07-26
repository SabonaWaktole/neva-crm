export enum FieldType {
  TEXT = 'TEXT',
  NUMBER = 'NUMBER',
  DATE = 'DATE',
  BOOLEAN = 'BOOLEAN',
  /** Requires a non-empty `options` list — see CustomFieldDefinition.create. */
  SINGLE_SELECT = 'SINGLE_SELECT',
}
