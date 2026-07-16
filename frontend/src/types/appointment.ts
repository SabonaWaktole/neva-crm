export const AppointmentStatus = {
  SCHEDULED: 'SCHEDULED',
  CONFIRMED: 'CONFIRMED',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
} as const;

export type AppointmentStatus = typeof AppointmentStatus[keyof typeof AppointmentStatus];

export interface Appointment {
  id: string;
  tenantId: string;
  clientId: string;
  assignedUserId: string;
  scheduledAt: string;
  status: AppointmentStatus;
  notes?: string;
  history: Array<{
    id: string;
    action: string;
    changedByUserId: string;
    details?: any;
    timestamp: string;
  }>;
  // Included from API responses
  clientName?: string;
  staffName?: string;
}

export interface SearchAppointmentsParams {
  startDate: string;
  endDate: string;
  clientId?: string;
  assignedUserId?: string;
  status?: AppointmentStatus;
}

export interface PaginatedAppointments {
  items: Appointment[];
  total: number;
}
