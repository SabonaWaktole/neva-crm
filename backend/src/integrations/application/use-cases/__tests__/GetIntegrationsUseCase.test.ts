import { GetIntegrationsUseCase } from '../GetIntegrationsUseCase';
import { IIntegrationRepository } from '../../../domain/repositories/IIntegrationRepository';
import { Integration } from '../../../domain/entities/Integration';

describe('GetIntegrationsUseCase', () => {
  let mockRepo: jest.Mocked<IIntegrationRepository>;
  let useCase: GetIntegrationsUseCase;

  beforeEach(() => {
    mockRepo = {
      findByTenantId: jest.fn(),
      findByProvider: jest.fn(),
      save: jest.fn(),
    };
    useCase = new GetIntegrationsUseCase(mockRepo);
  });

  it('should return all integrations for a tenant', async () => {
    const integrations = [
      new Integration({
        id: 'i1',
        tenantId: 't1',
        provider: 'GOOGLE_CALENDAR',
        status: 'CONNECTED',
        config: null,
        createdAt: new Date(),
        updatedAt: new Date()
      })
    ];

    mockRepo.findByTenantId.mockResolvedValue(integrations);

    const result = await useCase.execute({ tenantId: 't1' });
    expect(result).toEqual(integrations);
    expect(mockRepo.findByTenantId).toHaveBeenCalledWith('t1');
  });
});
