import { SearchClientsUseCase } from '../../../../../src/clients/application/use-cases/SearchClientsUseCase';
import { IClientRepository } from '../../../../../src/clients/domain/repositories/IClientRepository';
import { Client } from '../../../../../src/clients/domain/entities/Client';
import { ClientStatus } from '../../../../../src/clients/domain/enums/ClientStatus';

describe('SearchClientsUseCase', () => {
  let useCase: SearchClientsUseCase;
  let clientRepo: jest.Mocked<IClientRepository>;

  beforeEach(() => {
    clientRepo = {
      findById: jest.fn(),
      search: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
    };
    useCase = new SearchClientsUseCase(clientRepo);
  });

  it('searches clients with custom field filters', async () => {
    clientRepo.search.mockResolvedValue({ items: [], total: 0 });

    await useCase.execute({
      tenantId: 't1',
      filters: { customFields: { industry: 'Tech' } },
      skip: 0,
      take: 10,
    });

    expect(clientRepo.search).toHaveBeenCalledWith(
      't1',
      { customFields: { industry: 'Tech' } },
      0,
      10
    );
  });
});
