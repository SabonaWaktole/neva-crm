import { IClientRepository, SearchClientsFilters } from '../../domain/repositories/IClientRepository';
import { Client } from '../../domain/entities/Client';

interface SearchClientsDTO {
  tenantId: string;
  filters: SearchClientsFilters;
  skip?: number;
  take?: number;
}

export class SearchClientsUseCase {
  constructor(private clientRepo: IClientRepository) {}

  async execute(dto: SearchClientsDTO): Promise<{ items: Client[]; total: number }> {
    const skip = dto.skip ?? 0;
    const take = dto.take ?? 50;

    return this.clientRepo.search(dto.tenantId, dto.filters, skip, take);
  }
}
