import { IClientRepository } from '../../domain/repositories/IClientRepository';
import { Client } from '../../domain/entities/Client';
import { DomainError } from '../../../shared/domain/errors/DomainError';

export class GetClientUseCase {
  constructor(private clientRepo: IClientRepository) {}

  async execute(tenantId: string, clientId: string): Promise<Client> {
    const client = await this.clientRepo.findById(tenantId, clientId);
    if (!client || client.tenantId !== tenantId) {
      throw new DomainError('Client not found');
    }
    return client;
  }
}
