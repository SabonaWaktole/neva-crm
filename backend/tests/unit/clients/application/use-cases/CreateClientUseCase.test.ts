import { CreateClientUseCase } from '../../../../../src/clients/application/use-cases/CreateClientUseCase';
import { IClientRepository } from '../../../../../src/clients/domain/repositories/IClientRepository';
import { ICustomFieldDefinitionRepository } from '../../../../../src/clients/domain/repositories/ICustomFieldDefinitionRepository';
import { CustomFieldDefinition } from '../../../../../src/clients/domain/entities/CustomFieldDefinition';
import { FieldType } from '../../../../../src/clients/domain/enums/FieldType';
import { ClientStatus } from '../../../../../src/clients/domain/enums/ClientStatus';

describe('CreateClientUseCase', () => {
  let useCase: CreateClientUseCase;
  let clientRepo: jest.Mocked<IClientRepository>;
  let customFieldRepo: jest.Mocked<ICustomFieldDefinitionRepository>;

  beforeEach(() => {
    clientRepo = {
      findById: jest.fn(),
      search: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
    };

    customFieldRepo = {
      findByTenantId: jest.fn(),
      save: jest.fn(),
    };

    useCase = new CreateClientUseCase(clientRepo, customFieldRepo);
  });

  it('creates a client successfully when custom fields are valid', async () => {
    const textDef = CustomFieldDefinition.create({
      id: 'f1', tenantId: 't1', fieldName: 'source', fieldType: FieldType.TEXT
    });
    customFieldRepo.findByTenantId.mockResolvedValue([textDef]);

    const result = await useCase.execute({
      tenantId: 't1',
      name: 'Acme Corp',
      email: 'contact@acme.com',
      status: ClientStatus.PROSPECT,
      customFieldValues: { source: 'Referral' },
      authorUserId: 'u1',
    });

    expect(result.id).toBeDefined();
    expect(result.name).toBe('Acme Corp');
    expect(clientRepo.save).toHaveBeenCalledWith('t1', expect.anything());
  });

  it('rejects creation if custom field does not match definition', async () => {
    const textDef = CustomFieldDefinition.create({
      id: 'f1', tenantId: 't1', fieldName: 'source', fieldType: FieldType.TEXT
    });
    customFieldRepo.findByTenantId.mockResolvedValue([textDef]);

    await expect(useCase.execute({
      tenantId: 't1',
      name: 'Acme Corp',
      status: ClientStatus.PROSPECT,
      customFieldValues: { unknownField: 'test' },
      authorUserId: 'u1',
    })).rejects.toThrow('Field "unknownField" is not defined for this tenant.');

    expect(clientRepo.save).not.toHaveBeenCalled();
  });
});
