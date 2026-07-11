import { GetClientHistoryUseCase } from '../../../../../src/clients/application/use-cases/GetClientHistoryUseCase';
import { IClientRepository } from '../../../../../src/clients/domain/repositories/IClientRepository';
import { IInteractionRepository } from '../../../../../src/clients/domain/repositories/IInteractionRepository';
import { Client } from '../../../../../src/clients/domain/entities/Client';
import { Interaction } from '../../../../../src/clients/domain/entities/Interaction';
import { ClientStatus } from '../../../../../src/clients/domain/enums/ClientStatus';
import { InteractionChannel } from '../../../../../src/clients/domain/enums/InteractionChannel';

describe('GetClientHistoryUseCase', () => {
  let useCase: GetClientHistoryUseCase;
  let clientRepo: jest.Mocked<IClientRepository>;
  let interactionRepo: jest.Mocked<IInteractionRepository>;

  beforeEach(() => {
    clientRepo = {
      findById: jest.fn(),
      search: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
    };
    interactionRepo = {
      findByClientId: jest.fn(),
      save: jest.fn(),
    };
    useCase = new GetClientHistoryUseCase(clientRepo, interactionRepo);
  });

  it('returns a chronological timeline of interactions', async () => {
    clientRepo.findById.mockResolvedValue(
      Client.create({
        id: 'c1', tenantId: 't1', name: 'Acme', contactInfo: {},
        status: ClientStatus.ACTIVE, customFieldValues: {},
        lastUpdatedByUserId: 'u1', createdAt: new Date(), updatedAt: new Date()
      }, [])
    );

    const int1 = Interaction.create({
      id: 'i1', tenantId: 't1', clientId: 'c1', authorUserId: 'u1',
      content: 'Hello', channel: InteractionChannel.NOTE,
      createdAt: new Date('2023-01-01T10:00:00Z'),
    });
    
    const int2 = Interaction.create({
      id: 'i2', tenantId: 't1', clientId: 'c1', authorUserId: 'u1',
      content: 'Follow up', channel: InteractionChannel.CALL,
      createdAt: new Date('2023-01-02T10:00:00Z'),
    });

    // Mock returns in mixed order
    interactionRepo.findByClientId.mockResolvedValue([int2, int1]);

    const result = await useCase.execute({ tenantId: 't1', clientId: 'c1' });

    // Should be sorted by createdAt descending
    expect(result.timeline.length).toBe(2);
    expect(result.timeline[0].id).toBe('i2'); // newest
    expect(result.timeline[1].id).toBe('i1'); // oldest
  });

  it('throws if client belongs to a different tenant', async () => {
    clientRepo.findById.mockResolvedValue(
      Client.create({
        id: 'c1', tenantId: 't2', name: 'Acme', contactInfo: {},
        status: ClientStatus.ACTIVE, customFieldValues: {},
        lastUpdatedByUserId: 'u1', createdAt: new Date(), updatedAt: new Date()
      }, [])
    );

    await expect(useCase.execute({ tenantId: 't1', clientId: 'c1' }))
      .rejects.toThrow('Client not found or access denied');
  });
});
