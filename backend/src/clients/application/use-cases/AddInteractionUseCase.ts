import { IClientRepository } from '../../domain/repositories/IClientRepository';
import { IInteractionRepository } from '../../domain/repositories/IInteractionRepository';
import { IOutcomeCategoryRepository } from '../../domain/repositories/IOutcomeCategoryRepository';
import { Interaction } from '../../domain/entities/Interaction';
import { InteractionChannel } from '../../domain/enums/InteractionChannel';
import { DomainError } from '../../../shared/domain/errors/DomainError';
import { randomUUID } from 'crypto';

interface AddInteractionDTO {
  tenantId: string;
  clientId: string;
  authorUserId: string;
  content: string;
  channel: InteractionChannel;
  outcomeCategoryId?: string;
}

export class AddInteractionUseCase {
  constructor(
    private clientRepo: IClientRepository,
    private interactionRepo: IInteractionRepository,
    private outcomeRepo: IOutcomeCategoryRepository
  ) {}

  async execute(dto: AddInteractionDTO): Promise<Interaction> {
    const client = await this.clientRepo.findById(dto.tenantId, dto.clientId);
    if (!client || client.tenantId !== dto.tenantId) {
      throw new DomainError('Client not found or access denied');
    }

    let outcomeCategory = null;
    if (dto.outcomeCategoryId) {
      outcomeCategory = await this.outcomeRepo.findById(dto.tenantId, dto.outcomeCategoryId);
      if (!outcomeCategory || outcomeCategory.tenantId !== dto.tenantId) {
        throw new DomainError('Outcome category not found or access denied');
      }
    }

    const interaction = Interaction.create({
      id: randomUUID(),
      tenantId: dto.tenantId,
      clientId: dto.clientId,
      authorUserId: dto.authorUserId,
      content: dto.content,
      channel: dto.channel,
      outcomeCategory: outcomeCategory,
      createdAt: new Date(),
    });

    await this.interactionRepo.save(dto.tenantId, interaction);
    return interaction;
  }
}
