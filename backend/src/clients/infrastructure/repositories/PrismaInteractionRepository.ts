import { PrismaClient, Prisma } from '@prisma/client';
import { IInteractionRepository } from '../../domain/repositories/IInteractionRepository';
import { Interaction } from '../../domain/entities/Interaction';
import { InteractionChannel } from '../../domain/enums/InteractionChannel';
import { OutcomeCategory } from '../../domain/entities/OutcomeCategory';

export class PrismaInteractionRepository implements IInteractionRepository {
  constructor(private prisma: PrismaClient) {}

  async findByClientId(tenantId: string, clientId: string): Promise<Interaction[]> {
    const records = await this.prisma.interaction.findMany({
      where: { tenantId, clientId },
      include: { outcomeCategory: true },
      orderBy: { createdAt: 'desc' },
    });

    return records.map(r => Interaction.create({
      id: r.id,
      tenantId: r.tenantId,
      clientId: r.clientId,
      authorUserId: r.authorUserId,
      content: r.content,
      channel: r.channel as InteractionChannel,
      outcomeCategory: r.outcomeCategory ? OutcomeCategory.create({
        id: r.outcomeCategory.id,
        tenantId: r.outcomeCategory.tenantId,
        label: r.outcomeCategory.label,
      }) : undefined,
      createdAt: r.createdAt,
    }));
  }

  async findById(id: string): Promise<Interaction | null> {
    const record = await this.prisma.interaction.findUnique({
      where: { id },
      include: { outcomeCategory: true },
    });
    if (!record) return null;

    return Interaction.create({
      id: record.id,
      tenantId: record.tenantId,
      clientId: record.clientId,
      authorUserId: record.authorUserId,
      content: record.content,
      channel: record.channel as InteractionChannel,
      outcomeCategory: record.outcomeCategory ? OutcomeCategory.create({
        id: record.outcomeCategory.id,
        tenantId: record.outcomeCategory.tenantId,
        label: record.outcomeCategory.label,
      }) : undefined,
      createdAt: record.createdAt,
    });
  }

  async findRecentByTenant(tenantId: string, limit: number, authorUserId?: string): Promise<Interaction[]> {
    const where: Prisma.InteractionWhereInput = { tenantId };
    if (authorUserId) {
      where.authorUserId = authorUserId;
    }

    const records = await this.prisma.interaction.findMany({
      where,
      include: { outcomeCategory: true },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return records.map(r => Interaction.create({
      id: r.id,
      tenantId: r.tenantId,
      clientId: r.clientId,
      authorUserId: r.authorUserId,
      content: r.content,
      channel: r.channel as InteractionChannel,
      outcomeCategory: r.outcomeCategory ? OutcomeCategory.create({
        id: r.outcomeCategory.id,
        tenantId: r.outcomeCategory.tenantId,
        label: r.outcomeCategory.label,
      }) : undefined,
      createdAt: r.createdAt,
    }));
  }

  async save(tenantId: string, interaction: Interaction): Promise<void> {
    await this.prisma.interaction.create({
      data: {
        id: interaction.id,
        tenantId: interaction.tenantId,
        clientId: interaction.clientId,
        authorUserId: interaction.authorUserId,
        content: interaction.content,
        channel: interaction.channel,
        outcomeCategoryId: interaction.outcomeCategory?.id || null,
        createdAt: interaction.createdAt,
      },
    });
  }
}
