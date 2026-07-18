import { IAppointmentRepository } from '../../domain/repositories/IAppointmentRepository';

export class GetAppointmentHistoryUseCase {
  constructor(private readonly appointmentRepository: IAppointmentRepository) {}

  async execute(dto: { id: string; tenantId: string }) {
    const { id, tenantId } = dto;
    const appointment = await this.appointmentRepository.findById(id, tenantId);
    if (!appointment) {
      throw new Error('Appointment not found');
    }

    return appointment.history.map((log) => ({
      id: log.id,
      previousDate: log.previousDate,
      newDate: log.newDate,
      reason: log.reason,
      changedBy: log.changedBy,
      createdAt: log.createdAt,
    }));
  }
}
