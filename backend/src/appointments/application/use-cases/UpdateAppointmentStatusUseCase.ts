import { IAppointmentRepository } from '../../domain/repositories/IAppointmentRepository';
import { Appointment } from '../../domain/entities/Appointment';

export interface UpdateAppointmentStatusDTO {
  id: string;
  tenantId: string;
  status: string;
}

export class UpdateAppointmentStatusUseCase {
  constructor(private readonly appointmentRepository: IAppointmentRepository) {}

  async execute(dto: UpdateAppointmentStatusDTO): Promise<Appointment> {
    const appointment = await this.appointmentRepository.findById(dto.id, dto.tenantId);
    if (!appointment) {
      throw new Error('Appointment not found');
    }

    if (dto.status === 'CONFIRMED') {
      appointment.confirm();
    } else if (dto.status === 'COMPLETED') {
      appointment.complete();
    } else {
      throw new Error('Invalid status transition requested');
    }

    await this.appointmentRepository.update(appointment);
    return appointment;
  }
}
