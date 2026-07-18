import { Interaction } from '../../clients/domain/entities/Interaction';
import { Appointment } from '../../appointments/domain/entities/Appointment';
import { Client } from '../../clients/domain/entities/Client';

export interface TimelineMergerOptions {
  limit?: number;
}

export class TimelineMerger {
  static merge(
    interactions: Interaction[],
    appointments: Appointment[],
    clients: Client[] = [],
    options: TimelineMergerOptions = {}
  ): any[] {
    const interactionTimeline = interactions.map(interaction => ({
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

    const appointmentTimeline = appointments.map(appointment => ({
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

    const clientTimeline = clients.map(client => ({
      id: client.id,
      timestamp: client.createdAt.toISOString(),
      type: 'CLIENT_CREATED',
      description: 'Client Added',
      actor: client.assignedUserId || 'system',
      details: {
        name: client.name,
        status: client.status,
      },
    }));

    const timeline = [...interactionTimeline, ...appointmentTimeline, ...clientTimeline];

    // Sort descending by timestamp
    timeline.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    if (options.limit && options.limit > 0) {
      return timeline.slice(0, options.limit);
    }

    return timeline;
  }
}
