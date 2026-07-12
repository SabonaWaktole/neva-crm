import { IAppointmentRepository } from '../../domain/repositories/IAppointmentRepository';

export interface CancelAppointmentDTO {
  id: string;
  tenantId: string;
  reason: string;
  changedByUserId: string;
}

export class CancelAppointmentUseCase {
  constructor(private readonly appointmentRepository: IAppointmentRepository) {}

  async execute(dto: CancelAppointmentDTO): Promise<void> {
    const appointment = await this.appointmentRepository.findById(dto.id, dto.tenantId);
    if (!appointment) {
      throw new Error('Appointment not found');
    }

    appointment.cancel(dto.reason, dto.changedByUserId);

    await this.appointmentRepository.update(appointment);
  }
}
