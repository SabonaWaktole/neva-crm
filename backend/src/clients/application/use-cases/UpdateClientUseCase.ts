import { IClientRepository } from '../../domain/repositories/IClientRepository';
import { ICustomFieldDefinitionRepository } from '../../domain/repositories/ICustomFieldDefinitionRepository';
import { Client } from '../../domain/entities/Client';
import { ClientStatus } from '../../domain/enums/ClientStatus';
import { DomainError } from '../../../shared/domain/errors/DomainError';

interface UpdateClientDTO {
  tenantId: string;
  clientId: string;
  name?: string;
  email?: string;
  phone?: string;
  status?: ClientStatus;
  assignedUserId?: string | null;
  customFieldValues?: Record<string, any>;
  updatingUserId: string;
}

export class UpdateClientUseCase {
  constructor(
    private clientRepo: IClientRepository,
    private customFieldRepo: ICustomFieldDefinitionRepository
  ) {}

  async execute(dto: UpdateClientDTO): Promise<Client> {
    const existingClient = await this.clientRepo.findById(dto.tenantId, dto.clientId);
    if (!existingClient || existingClient.tenantId !== dto.tenantId) {
      throw new DomainError('Client not found or access denied');
    }

    const definitions = await this.customFieldRepo.findByTenantId(dto.tenantId);

    // Merge custom field values
    const mergedCustomFields = dto.customFieldValues
      ? { ...existingClient.customFieldValues, ...dto.customFieldValues }
      : existingClient.customFieldValues;

    // We rely on Client.create to validate custom fields again
    const updatedClient = Client.create({
      id: existingClient.id,
      tenantId: existingClient.tenantId,
      name: dto.name !== undefined ? dto.name : existingClient.name,
      contactInfo: {
        email: dto.email !== undefined ? dto.email : existingClient.contactInfo.email,
        phone: dto.phone !== undefined ? dto.phone : existingClient.contactInfo.phone,
      },
      status: dto.status !== undefined ? dto.status : existingClient.status,
      assignedUserId: dto.assignedUserId !== undefined ? dto.assignedUserId : existingClient.assignedUserId,
      customFieldValues: mergedCustomFields,
      lastUpdatedByUserId: dto.updatingUserId,
      createdAt: existingClient.createdAt,
      updatedAt: new Date(),
    }, definitions);

    await this.clientRepo.update(dto.tenantId, updatedClient);
    return updatedClient;
  }
}
