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

    // Map interactions to the timeline format expected by the frontend
    const timeline = interactions.map((interaction: Interaction) => ({
      id: interaction.id,
      timestamp: interaction.createdAt.toISOString(),
      type: 'INTERACTION_ADDED',
      description: `Interaction (${interaction.channel})`,
      actor: interaction.authorUserId,
      details: {
        channel: interaction.channel,
        content: interaction.content,
        outcomeCategoryId: interaction.outcomeCategory?.id || null,
      },
    }));

    // Sort descending by timestamp
    timeline.sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return { timeline };
  }
}
