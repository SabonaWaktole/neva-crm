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
      countByTenant: jest.fn(),
      findRecentByTenant: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
    } as any;

    interactionRepo = {
      findById: jest.fn(),
      findByClientId: jest.fn(),
      findRecentByTenant: jest.fn(),
      save: jest.fn(),
    } as any;
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
    
    // Assert the exact mapped shape expected by the frontend
    expect(result.timeline[0]).toEqual({
      id: 'i2',
      timestamp: '2023-01-02T10:00:00.000Z',
      type: 'INTERACTION_ADDED',
      description: 'Interaction (CALL)',
      actor: 'u1',
      details: {
        channel: 'CALL',
        content: 'Follow up',
        outcomeCategoryId: null
      }
    });
    
    expect(result.timeline[1]).toEqual({
      id: 'i1',
      timestamp: '2023-01-01T10:00:00.000Z',
      type: 'INTERACTION_ADDED',
      description: 'Interaction (NOTE)',
      actor: 'u1',
      details: {
        channel: 'NOTE',
        content: 'Hello',
        outcomeCategoryId: null
      }
    });
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
