import { IAppointmentRepository } from '../../domain/repositories/IAppointmentRepository';
import { Appointment } from '../../domain/entities/Appointment';
import { NotificationService } from '../../../notifications/application/NotificationService';

export interface CancelAppointmentDTO {
  id: string;
  tenantId: string;
  reason: string;
  changedByUserId: string;
}

export class CancelAppointmentUseCase {
  constructor(
    private readonly appointmentRepository: IAppointmentRepository,
    private readonly notifications?: NotificationService
  ) {}

  async execute(dto: CancelAppointmentDTO): Promise<Appointment> {
    const appointment = await this.appointmentRepository.findById(dto.id, dto.tenantId);
    if (!appointment) {
      throw new Error('Appointment not found');
    }

    appointment.cancel(dto.reason, dto.changedByUserId);

    await this.appointmentRepository.update(appointment);

    // The assignee needs to know their appointment is off; if they cancelled
    // it themselves, emit drops them and nothing is written.
    await this.notifications?.emitSafe({
      tenantId: dto.tenantId,
      recipientUserIds: [appointment.assignedUserId],
      type: 'APPOINTMENT_CANCELLED',
      params: { reason: dto.reason },
      actorUserId: dto.changedByUserId,
      entityType: 'APPOINTMENT',
      entityId: appointment.id,
    });

    return appointment;
  }
}
