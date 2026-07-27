import { IClientRepository } from '../../domain/repositories/IClientRepository';
import { NotificationService } from '../../../notifications/application/NotificationService';
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
    private customFieldRepo: ICustomFieldDefinitionRepository,
    private notifications?: NotificationService
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

    // A client can be assigned at creation, so this is the second assignment
    // site, not a duplicate of the one in UpdateClientUseCase. There is no
    // previous value to compare against here — any assignee is a new one.
    if (client.assignedUserId) {
      await this.notifications?.emitSafe({
        tenantId: dto.tenantId,
        recipientUserIds: [client.assignedUserId],
        type: 'CLIENT_ASSIGNED',
        params: { client: client.name },
        actorUserId: dto.authorUserId,
        entityType: 'CLIENT',
        entityId: client.id,
      });
    }

    return client;
  }
}
