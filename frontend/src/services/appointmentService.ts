import { apiClient } from '../api';
import type { 
  Appointment, 
  SearchAppointmentsParams, 
  AppointmentStatus
} from '../types/appointment';

export const appointmentService = {
  createAppointment: async (tenantSlug: string, data: { clientId: string; assignedUserId: string; scheduledAt: string; notes?: string }) => {
    const response = await apiClient.post<Appointment>(`/${tenantSlug}/appointments`, data);
    return response.data;
  },

  rescheduleAppointment: async (tenantSlug: string, appointmentId: string, data: { newDate: string; reason: string }) => {
    const response = await apiClient.put<Appointment>(`/${tenantSlug}/appointments/${appointmentId}/reschedule`, data);
    return response.data;
  },

  cancelAppointment: async (tenantSlug: string, appointmentId: string, data: { reason: string }) => {
    const response = await apiClient.put<Appointment>(`/${tenantSlug}/appointments/${appointmentId}/cancel`, data);
    return response.data;
  },

  updateAppointmentStatus: async (tenantSlug: string, appointmentId: string, data: { status: AppointmentStatus }) => {
    const response = await apiClient.put<Appointment>(`/${tenantSlug}/appointments/${appointmentId}/status`, data);
    return response.data;
  },

  searchAppointments: async (tenantSlug: string, params: SearchAppointmentsParams) => {
    const response = await apiClient.get<Appointment[]>(`/${tenantSlug}/appointments/search`, { params });
    return response.data;
  },

  getUpcomingAppointments: async (tenantSlug: string, limit?: number) => {
    const response = await apiClient.get<Appointment[]>(`/${tenantSlug}/appointments/upcoming`, { params: { limit } });
    return response.data;
  },

  getAppointmentHistory: async (tenantSlug: string, appointmentId: string) => {
    // We can type this strictly based on what history returns
    const response = await apiClient.get<any[]>(`/${tenantSlug}/appointments/${appointmentId}/history`);
    return response.data;
  },
};
