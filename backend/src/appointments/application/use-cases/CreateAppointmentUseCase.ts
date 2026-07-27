import { IAppointmentRepository } from '../../domain/repositories/IAppointmentRepository';
import { Appointment } from '../../domain/entities/Appointment';
import { DomainError } from '../../../shared/domain/errors/DomainError';
import { NotificationService } from '../../../notifications/application/NotificationService';

export interface CreateAppointmentDTO {
  tenantId: string;
  clientId: string;
  assignedUserId: string;
  scheduledAt: Date;
  notes?: string;
  /**
   * Who is creating it. Added for notifications: cancel and reschedule already
   * carried `changedByUserId`, but create carried no actor at all, so
   * "X scheduled an appointment for you" had no X to name.
   */
  actingUserId: string;
}

export class CreateAppointmentUseCase {
  constructor(
    private readonly appointmentRepository: IAppointmentRepository,
    private readonly clientRepository: any, // IClientRepository in reality
    private readonly userRepository: any, // IUserRepository in reality
    private readonly notifications?: NotificationService
  ) {}

  async execute(dto: CreateAppointmentDTO): Promise<Appointment> {
    const client = await this.clientRepository.findById(dto.tenantId, dto.clientId);
    if (!client) {
      throw new Error('Client not found');
    }
    if (client.tenantId !== dto.tenantId) {
      throw new DomainError('Client does not belong to this tenant');
    }

    const user = await this.userRepository.findById(dto.assignedUserId);
    if (!user) {
      throw new Error('Assigned user not found');
    }
    if (user.tenantId !== dto.tenantId) {
      throw new DomainError('Assigned user does not belong to this tenant');
    }

    const appointment = Appointment.create({
      id: crypto.randomUUID(), // Assuming a UUID generator or pass it in
      tenantId: dto.tenantId,
      clientId: dto.clientId,
      assignedUserId: dto.assignedUserId,
      scheduledAt: dto.scheduledAt,
      notes: dto.notes,
      clientTenantId: client.tenantId,
      assignedUserTenantId: user.tenantId,
    });

    await this.appointmentRepository.save(appointment);

    /*
     * emitSafe, not emit: this write is not in a transaction with the
     * appointment, and a failed notification must not lose a saved
     * appointment. The quotation transitions can use `emit` because there the
     * notification commits with the change it describes.
     *
     * Self-assignment produces nothing — NotificationService drops a recipient
     * who is also the actor, which is the common case here since the form
     * defaults to "Myself".
     */
    await this.notifications?.emitSafe({
      tenantId: dto.tenantId,
      recipientUserIds: [dto.assignedUserId],
      type: 'APPOINTMENT_ASSIGNED',
      // Snapshot: the client name as it was when the appointment was made.
      params: { client: client.name ?? '' },
      actorUserId: dto.actingUserId,
      entityType: 'APPOINTMENT',
      entityId: appointment.id,
    });

    return appointment;
  }
}
