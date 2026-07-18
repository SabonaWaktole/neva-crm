import { Appointment } from '../entities/Appointment';
import { AppointmentStatus } from '../enums/AppointmentStatus';

export interface SearchAppointmentsFilters {
  clientId?: string;
  assignedUserId?: string;
  status?: AppointmentStatus;
}

export interface IAppointmentRepository {
  findById(id: string, tenantId: string): Promise<Appointment | null>;
  findByClientId(clientId: string, tenantId: string): Promise<Appointment[]>;
  findByDateRange(tenantId: string, startDate: Date, endDate: Date, filters?: SearchAppointmentsFilters): Promise<Appointment[]>;
  findUpcoming(tenantId: string, assignedUserId?: string, limit?: number): Promise<Appointment[]>;
  findRecentByTenant(tenantId: string, limit: number, assignedUserId?: string): Promise<Appointment[]>;
  save(appointment: Appointment): Promise<void>;
  update(appointment: Appointment): Promise<void>;
}
