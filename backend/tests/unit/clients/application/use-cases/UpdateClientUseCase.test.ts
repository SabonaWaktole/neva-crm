import { UpdateClientUseCase } from '../../../../../src/clients/application/use-cases/UpdateClientUseCase';
import { IClientRepository } from '../../../../../src/clients/domain/repositories/IClientRepository';
import { ICustomFieldDefinitionRepository } from '../../../../../src/clients/domain/repositories/ICustomFieldDefinitionRepository';
import { Client } from '../../../../../src/clients/domain/entities/Client';
import { ClientStatus } from '../../../../../src/clients/domain/enums/ClientStatus';

describe('UpdateClientUseCase', () => {
  let useCase: UpdateClientUseCase;
  let clientRepo: jest.Mocked<IClientRepository>;
  let customFieldRepo: jest.Mocked<ICustomFieldDefinitionRepository>;

  beforeEach(() => {
    clientRepo = {
      findById: jest.fn(),
      search: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
      countByTenant: jest.fn(),
      findRecentByTenant: jest.fn(),
    } as any;
    customFieldRepo = {
      findByTenantId: jest.fn(),
      save: jest.fn(),
    };
    useCase = new UpdateClientUseCase(clientRepo, customFieldRepo);
  });

  it('updates a client and records the updater', async () => {
    const existingClient = Client.create({
      id: 'c1',
      tenantId: 't1',
      name: 'Old Name',
      contactInfo: {},
      status: ClientStatus.PROSPECT,
      customFieldValues: {},
      lastUpdatedByUserId: 'u1',
      createdAt: new Date(),
      updatedAt: new Date(),
    }, []);

    clientRepo.findById.mockResolvedValue(existingClient);
    customFieldRepo.findByTenantId.mockResolvedValue([]);

    const result = await useCase.execute({
      tenantId: 't1',
      clientId: 'c1',
      name: 'New Name',
      updatingUserId: 'u2',
    });

    expect(clientRepo.update).toHaveBeenCalledWith('t1', expect.anything());
    expect(result.name).toBe('New Name');
    expect(result.lastUpdatedByUserId).toBe('u2');
  });

  it('prevents updating a client from another tenant', async () => {
    const existingClient = Client.create({
      id: 'c1',
      tenantId: 't2', // Different tenant
      name: 'Old Name',
      contactInfo: {},
      status: ClientStatus.PROSPECT,
      customFieldValues: {},
      lastUpdatedByUserId: 'u1',
      createdAt: new Date(),
      updatedAt: new Date(),
    }, []);

    clientRepo.findById.mockResolvedValue(existingClient);

    await expect(useCase.execute({
      tenantId: 't1',
      clientId: 'c1',
      name: 'New Name',
      updatingUserId: 'u2',
    })).rejects.toThrow('Client not found or access denied');
  });
});
