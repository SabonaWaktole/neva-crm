import { IClientRepository } from '../../domain/repositories/IClientRepository';
import { IInteractionRepository } from '../../domain/repositories/IInteractionRepository';
import { Interaction } from '../../domain/entities/Interaction';
import { DomainError } from '../../../shared/domain/errors/DomainError';

interface GetClientHistoryDTO {
  tenantId: string;
  clientId: string;
}

export class GetClientHistoryUseCase {
  constructor(
    private clientRepo: IClientRepository,
    private interactionRepo: IInteractionRepository
  ) {}

  async execute(dto: GetClientHistoryDTO): Promise<{ timeline: any[] }> {
    const client = await this.clientRepo.findById(dto.tenantId, dto.clientId);
    if (!client || client.tenantId !== dto.tenantId) {
      throw new DomainError('Client not found or access denied');
    }

    const interactions = await this.interactionRepo.findByClientId(dto.tenantId, dto.clientId);

    // TODO: Merge with Appointments and Quotations in future milestones
    const timeline = [...interactions];

    // Sort descending by createdAt
    timeline.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    return { timeline };
  }
}
