import { useState, useCallback, useEffect } from 'react';
import { appointmentService } from '../services/appointmentService';
import { useParams } from 'react-router-dom';
import type { Appointment, AppointmentStatus } from '../types/appointment';
import { useAuthStore } from '../store/useAuthStore';
import { patchAppointmentInList } from '../utils/appointmentUtils';

export const useAppointmentsByDateRange = (startDate?: string, endDate?: string) => {
  const { tenantSlug } = useParams();
  const authTenantId = useAuthStore((state) => state.user?.tenantId);
  const activeTenant = tenantSlug || authTenantId; // fallback for widgets not under route

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAppointments = useCallback(async (start: string, end: string) => {
    if (!activeTenant) return;
    setIsLoading(true);
    setError(null);
    try {
      const result = await appointmentService.searchAppointments(activeTenant, { startDate: start, endDate: end });
      setAppointments(result);
      setTotal(result.length);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch appointments');
    } finally {
      setIsLoading(false);
    }
  }, [activeTenant]);

  // Reactive auto-fetch when params change
  useEffect(() => {
    if (startDate && endDate) {
      fetchAppointments(startDate, endDate);
    }
  }, [startDate, endDate, fetchAppointments]);

  const updateAppointmentLocally = useCallback((updatedAppointment: Appointment) => {
    setAppointments(prev => patchAppointmentInList(prev, updatedAppointment));
  }, []);

  return { appointments, total, isLoading, error, fetchAppointments, updateAppointmentLocally };
};

export const useClientAppointments = (clientId: string) => {
  const { tenantSlug } = useParams();
  const authTenantId = useAuthStore((state) => state.user?.tenantId);
  const activeTenant = tenantSlug || authTenantId;

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchClientAppointments = useCallback(async () => {
    if (!activeTenant || !clientId) return;
    setIsLoading(true);
    setError(null);
    try {
      // Use a wide date range for client history
      const start = new Date(new Date().getFullYear() - 2, 0, 1).toISOString();
      const end = new Date(new Date().getFullYear() + 2, 0, 1).toISOString();
      const result = await appointmentService.searchAppointments(activeTenant, { startDate: start, endDate: end, clientId });
      setAppointments(result);
      setTotal(result.length);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch client appointments');
    } finally {
      setIsLoading(false);
    }
  }, [activeTenant, clientId]);

  useEffect(() => {
    fetchClientAppointments();
  }, [fetchClientAppointments]);

  const updateAppointmentLocally = useCallback((updatedAppointment: Appointment) => {
    setAppointments(prev => patchAppointmentInList(prev, updatedAppointment));
  }, []);

  return { appointments, total, isLoading, error, fetchClientAppointments, updateAppointmentLocally };
};

export const useUpcomingAppointments = (limit: number = 5) => {
  const { tenantSlug } = useParams();
  const authTenantId = useAuthStore((state) => state.user?.tenantId);
  const activeTenant = tenantSlug || authTenantId; // fallback since dashboard widget might not be under /:tenantSlug immediately depending on routing

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchUpcoming = useCallback(async (fetchLimit: number) => {
    if (!activeTenant) return;
    setIsLoading(true);
    setError(null);
    try {
      const result = await appointmentService.getUpcomingAppointments(activeTenant, fetchLimit);
      setAppointments(result);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch upcoming appointments');
    } finally {
      setIsLoading(false);
    }
  }, [activeTenant]);

  // Reactive auto-fetch
  useEffect(() => {
    fetchUpcoming(limit);
  }, [limit, fetchUpcoming]);

  return { appointments, isLoading, error, fetchUpcoming };
};

export const useCreateAppointment = () => {
  const { tenantSlug } = useParams();
  const authTenantId = useAuthStore((state) => state.user?.tenantId);
  const activeTenant = tenantSlug || authTenantId;

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createAppointment = async (data: { clientId: string; assignedUserId: string; scheduledAt: string; notes?: string }) => {
    if (!activeTenant) throw new Error('Missing tenant context');
    setIsLoading(true);
    setError(null);
    try {
      return await appointmentService.createAppointment(activeTenant, data);
    } catch (err: any) {
      const msg = err.response?.data?.error || 'Failed to create appointment';
      setError(msg);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return { createAppointment, isLoading, error };
};

export const useUpdateAppointment = () => {
  const { tenantSlug } = useParams();
  const authTenantId = useAuthStore((state) => state.user?.tenantId);
  const activeTenant = tenantSlug || authTenantId;

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateAppointment = async (appointmentId: string, data: { clientId?: string; assignedUserId?: string; scheduledAt?: string; notes?: string }) => {
    if (!activeTenant) throw new Error('Missing tenant context');
    setIsLoading(true);
    setError(null);
    try {
      return await appointmentService.updateAppointment(activeTenant, appointmentId, data);
    } catch (err: any) {
      const msg = err.response?.data?.error || 'Failed to update appointment';
      setError(msg);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return { updateAppointment, isLoading, error };
};

export const useRescheduleAppointment = () => {
  const { tenantSlug } = useParams();
  const authTenantId = useAuthStore((state) => state.user?.tenantId);
  const activeTenant = tenantSlug || authTenantId;

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const rescheduleAppointment = async (appointmentId: string, data: { newDate: string; reason: string }) => {
    if (!activeTenant) throw new Error('Missing tenant context');
    setIsLoading(true);
    setError(null);
    try {
      return await appointmentService.rescheduleAppointment(activeTenant, appointmentId, data);
    } catch (err: any) {
      const msg = err.response?.data?.error || 'Failed to reschedule appointment';
      setError(msg);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return { rescheduleAppointment, isLoading, error };
};

export const useCancelAppointment = () => {
  const { tenantSlug } = useParams();
  const authTenantId = useAuthStore((state) => state.user?.tenantId);
  const activeTenant = tenantSlug || authTenantId;

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cancelAppointment = async (appointmentId: string, data: { reason: string }) => {
    if (!activeTenant) throw new Error('Missing tenant context');
    setIsLoading(true);
    setError(null);
    try {
      return await appointmentService.cancelAppointment(activeTenant, appointmentId, data);
    } catch (err: any) {
      const msg = err.response?.data?.error || 'Failed to cancel appointment';
      setError(msg);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return { cancelAppointment, isLoading, error };
};

export const useUpdateAppointmentStatus = () => {
  const { tenantSlug } = useParams();
  const authTenantId = useAuthStore((state) => state.user?.tenantId);
  const activeTenant = tenantSlug || authTenantId;

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateStatus = async (appointmentId: string, data: { status: AppointmentStatus }) => {
    if (!activeTenant) throw new Error('Missing tenant context');
    setIsLoading(true);
    setError(null);
    try {
      return await appointmentService.updateAppointmentStatus(activeTenant, appointmentId, data);
    } catch (err: any) {
      const msg = err.response?.data?.error || 'Failed to update appointment status';
      setError(msg);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return { updateStatus, isLoading, error };
};

export const useAppointmentHistory = (appointmentId: string) => {
  const { tenantSlug } = useParams();
  const authTenantId = useAuthStore((state) => state.user?.tenantId);
  const activeTenant = tenantSlug || authTenantId;

  const [history, setHistory] = useState<any[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchHistory = useCallback(async () => {
    if (!activeTenant || !appointmentId) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await appointmentService.getAppointmentHistory(activeTenant, appointmentId);
      setHistory(data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch history');
    } finally {
      setIsLoading(false);
    }
  }, [activeTenant, appointmentId]);

  return { history, isLoading, error, fetchHistory };
};
