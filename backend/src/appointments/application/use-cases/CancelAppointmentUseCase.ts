import { IAppointmentRepository } from '../../domain/repositories/IAppointmentRepository';
import { Appointment } from '../../domain/entities/Appointment';

export interface CancelAppointmentDTO {
  id: string;
  tenantId: string;
  reason: string;
  changedByUserId: string;
}

export class CancelAppointmentUseCase {
  constructor(private readonly appointmentRepository: IAppointmentRepository) {}

  async execute(dto: CancelAppointmentDTO): Promise<Appointment> {
    const appointment = await this.appointmentRepository.findById(dto.id, dto.tenantId);
    if (!appointment) {
      throw new Error('Appointment not found');
    }

    appointment.cancel(dto.reason, dto.changedByUserId);

    await this.appointmentRepository.update(appointment);
    return appointment;
  }
}
