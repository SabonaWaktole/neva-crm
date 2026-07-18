import { z } from 'zod';
import {
  createClientSchema,
  updateClientSchema,
  searchClientsSchema,
  addInteractionSchema,
  defineCustomFieldSchema,
  defineOutcomeCategorySchema
} from '../../../../../../src/clients/interfaces/http/schemas/clientSchemas';
import { ClientStatus } from '../../../../../../src/clients/domain/enums/ClientStatus';
import { InteractionChannel } from '../../../../../../src/clients/domain/enums/InteractionChannel';
import { FieldType } from '../../../../../../src/clients/domain/enums/FieldType';

describe('clientSchemas', () => {
  describe('createClientSchema', () => {
    it('validates a correct payload', () => {
      const data = {
        name: 'Acme Corp',
        email: 'test@acme.com',
        phone: '+1234567890',
        status: ClientStatus.PROSPECT,
        customFieldValues: { industry: 'Tech' },
      };
      expect(createClientSchema.parse(data)).toEqual(data);
    });

    it('rejects missing name', () => {
      expect(() => createClientSchema.parse({ status: ClientStatus.PROSPECT }))
        .toThrow();
    });
  });

  describe('updateClientSchema', () => {
    it('validates a partial payload', () => {
      const data = { name: 'New Name' };
      expect(updateClientSchema.parse(data)).toEqual(data);
    });
  });

  describe('searchClientsSchema', () => {
    it('validates and coerces numeric string pagination', () => {
      const data = { skip: '10', take: '20', name: 'Acme' };
      const parsed = searchClientsSchema.parse(data);
      expect(parsed.skip).toBe(10);
      expect(parsed.take).toBe(20);
      expect(parsed.name).toBe('Acme');
    });

    it('handles empty filters', () => {
      expect(searchClientsSchema.parse({})).toEqual({ skip: 0, take: 50 });
    });
    
    it('parses customFields JSON string', () => {
      const parsed = searchClientsSchema.parse({ customFields: '{"industry":"Tech"}' });
      expect(parsed.customFields).toEqual({ industry: 'Tech' });
    });
  });

  describe('addInteractionSchema', () => {
    it('validates correct payload', () => {
      const data = {
        content: 'Good call',
        channel: InteractionChannel.CALL,
        outcomeCategoryId: '123e4567-e89b-12d3-a456-426614174000',
      };
      expect(addInteractionSchema.parse(data)).toEqual(data);
    });
  });

  describe('defineCustomFieldSchema', () => {
    it('validates correct payload', () => {
      const data = { fieldName: 'industry', fieldType: FieldType.TEXT };
      expect(defineCustomFieldSchema.parse(data)).toEqual(data);
    });

    it('requires options for SINGLE_SELECT', () => {
      expect(() => defineCustomFieldSchema.parse({ fieldName: 'size', fieldType: FieldType.SINGLE_SELECT }))
        .toThrow('Options are required for SINGLE_SELECT fields');
    });
  });

  describe('defineOutcomeCategorySchema', () => {
    it('validates correct payload', () => {
      const data = { label: 'Closed Won' };
      expect(defineOutcomeCategorySchema.parse(data)).toEqual(data);
    });
  });
});
