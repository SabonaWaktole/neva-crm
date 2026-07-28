import { IAppointmentRepository } from '../../domain/repositories/IAppointmentRepository';

export interface GetUpcomingAppointmentsDTO {
  tenantId: string;
  userId: string;
  role: string;
  limit?: number;
}

export class GetUpcomingAppointmentsUseCase {
  constructor(private readonly appointmentRepository: IAppointmentRepository) {}

  async execute(dto: GetUpcomingAppointmentsDTO) {
    const assignedUserId = dto.role === 'STAFF' ? dto.userId : undefined;
    const limit = dto.limit ?? 5;

    const appointments = await this.appointmentRepository.findUpcoming(
      dto.tenantId,
      assignedUserId,
      limit
    );

    return appointments.map((appt) => ({
      id: appt.id,
      tenantId: appt.tenantId,
      clientId: appt.clientId,
      clientName: appt.clientName,
      clientEmail: appt.clientEmail,
      assignedUserId: appt.assignedUserId,
      staffName: appt.staffName,
      scheduledAt: appt.scheduledAt,
      status: appt.status,
      notes: appt.notes,
    }));
  }
}
