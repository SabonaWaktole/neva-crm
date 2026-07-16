import { IAppointmentRepository } from '../../domain/repositories/IAppointmentRepository';
import { Appointment } from '../../domain/entities/Appointment';

export interface RescheduleAppointmentDTO {
  id: string;
  tenantId: string;
  newDate: Date;
  reason: string;
  changedByUserId: string;
}

export class RescheduleAppointmentUseCase {
  constructor(private readonly appointmentRepository: IAppointmentRepository) {}

  async execute(dto: RescheduleAppointmentDTO): Promise<Appointment> {
    const appointment = await this.appointmentRepository.findById(dto.id, dto.tenantId);
    if (!appointment) {
      throw new Error('Appointment not found');
    }

    appointment.reschedule(dto.newDate, dto.reason, dto.changedByUserId);

    await this.appointmentRepository.update(appointment);
    return appointment;
  }
}
