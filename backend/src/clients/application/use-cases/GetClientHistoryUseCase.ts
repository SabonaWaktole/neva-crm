import { IClientRepository } from '../../domain/repositories/IClientRepository';
import { IInteractionRepository } from '../../domain/repositories/IInteractionRepository';
import { IAppointmentRepository } from '../../../appointments/domain/repositories/IAppointmentRepository';
import { Interaction } from '../../domain/entities/Interaction';
import { Appointment } from '../../../appointments/domain/entities/Appointment';
import { DomainError } from '../../../shared/domain/errors/DomainError';

interface GetClientHistoryDTO {
  tenantId: string;
  clientId: string;
}

export class GetClientHistoryUseCase {
  constructor(
    private clientRepo: IClientRepository,
    private interactionRepo: IInteractionRepository,
    private appointmentRepo?: IAppointmentRepository
  ) {}

  async execute(dto: GetClientHistoryDTO): Promise<{ timeline: any[] }> {
    const client = await this.clientRepo.findById(dto.tenantId, dto.clientId);
    if (!client || client.tenantId !== dto.tenantId) {
      throw new DomainError('Client not found or access denied');
    }

    const interactions = await this.interactionRepo.findByClientId(dto.tenantId, dto.clientId);
    const appointments = this.appointmentRepo ? await this.appointmentRepo.findByClientId(dto.clientId, dto.tenantId) : [];

    // Map interactions to the timeline format expected by the frontend
    const interactionTimeline = interactions.map((interaction: Interaction) => ({
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

    const appointmentTimeline = appointments.map((appointment: Appointment) => ({
      id: appointment.id,
      timestamp: appointment.updatedAt.toISOString(), // Use updatedAt so recent changes float to the top
      type: `APPOINTMENT_${appointment.status}`,
      statusLabel: appointment.status,
      description: `Appointment (${appointment.status})`,
      actor: appointment.assignedUserId,
      details: {
        scheduledAt: appointment.scheduledAt.toISOString(),
        notes: appointment.notes,
        status: appointment.status,
      },
    }));

    const timeline = [...interactionTimeline, ...appointmentTimeline];

    // Sort descending by timestamp
    timeline.sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return { timeline };
  }
}
