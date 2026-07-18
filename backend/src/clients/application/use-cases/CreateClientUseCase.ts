import { IClientRepository } from '../../domain/repositories/IClientRepository';
import { ICustomFieldDefinitionRepository } from '../../domain/repositories/ICustomFieldDefinitionRepository';
import { Client } from '../../domain/entities/Client';
import { ClientStatus } from '../../domain/enums/ClientStatus';
import { randomUUID } from 'crypto';

interface CreateClientDTO {
  tenantId: string;
  name: string;
  email?: string;
  phone?: string;
  status: ClientStatus;
  assignedUserId?: string;
  customFieldValues?: Record<string, any>;
  authorUserId: string;
}

export class CreateClientUseCase {
  constructor(
    private clientRepo: IClientRepository,
    private customFieldRepo: ICustomFieldDefinitionRepository
  ) {}

  async execute(dto: CreateClientDTO): Promise<Client> {
    const definitions = await this.customFieldRepo.findByTenantId(dto.tenantId);

    const client = Client.create({
      id: randomUUID(),
      tenantId: dto.tenantId,
      name: dto.name,
      contactInfo: { email: dto.email, phone: dto.phone },
      status: dto.status,
      assignedUserId: dto.assignedUserId,
      customFieldValues: dto.customFieldValues || {},
      lastUpdatedByUserId: dto.authorUserId,
      createdAt: new Date(),
      updatedAt: new Date(),
    }, definitions);

    await this.clientRepo.save(dto.tenantId, client);
    return client;
  }
}
