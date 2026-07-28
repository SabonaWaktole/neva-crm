import { IAppointmentRepository } from '../../domain/repositories/IAppointmentRepository';
import { AppointmentStatus } from '../../domain/enums/AppointmentStatus';

export interface SearchAppointmentsFilters {
  clientId?: string;
  assignedUserId?: string;
  status?: AppointmentStatus;
}

export interface SearchAppointmentsDTO {
  tenantId: string;
  startDate: Date;
  endDate: Date;
  filters?: SearchAppointmentsFilters;
}

export class SearchAppointmentsUseCase {
  constructor(private readonly appointmentRepository: IAppointmentRepository) {}

  async execute(dto: SearchAppointmentsDTO) {
    const appointments = await this.appointmentRepository.findByDateRange(
      dto.tenantId,
      dto.startDate,
      dto.endDate,
      dto.filters
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
