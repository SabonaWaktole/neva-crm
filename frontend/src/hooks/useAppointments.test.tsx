import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import { useAppointmentsByDateRange, useUpcomingAppointments } from './useAppointments';
import { server } from '../setupTests';
import { http, HttpResponse } from 'msw';
import { useAuthStore } from '../store/useAuthStore';
import { AppointmentStatus } from '../types/appointment';

describe('useAppointmentsQueries', () => {
  beforeEach(() => {
    useAuthStore.setState({ 
      user: { userId: 'staff-1', role: 'STAFF', tenantId: 'tenant-1', tenantSlug: 'tenant-1' }, 
      isAuthenticated: true 
    });
  });

  describe('useAppointmentsByDateRange', () => {
    it('fetches appointments reactively based on date params', async () => {
      server.use(
        http.get('http://localhost:3000/api/tenant-1/appointments/search', ({ request }) => {
          const url = new URL(request.url);
          const startDate = url.searchParams.get('startDate');
          const endDate = url.searchParams.get('endDate');

          if (startDate === '2023-10-01' && endDate === '2023-10-31') {
            return HttpResponse.json([
              {
                id: 'app-1',
                tenantId: 'tenant-1',
                clientId: 'client-1',
                assignedUserId: 'staff-1',
                scheduledAt: '2023-10-15T10:00:00.000Z',
                status: AppointmentStatus.SCHEDULED,
                history: []
              }
            ]);
          }
          return HttpResponse.json([]);
        })
      );

      const { result } = renderHook(() => useAppointmentsByDateRange('2023-10-01', '2023-10-31'));

      // Wait for the reactive fetch to complete
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.appointments.length).toBe(1);
      expect(result.current.appointments[0].id).toBe('app-1');
      expect(result.current.error).toBeNull();
    });

    it('handles fetch failure', async () => {
      server.use(
        http.get('http://localhost:3000/api/tenant-1/appointments/search', () => {
          return HttpResponse.json({ error: 'Failed to fetch' }, { status: 500 });
        })
      );

      const { result } = renderHook(() => useAppointmentsByDateRange('2023-10-01', '2023-10-31'));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.error).toBe('Failed to fetch');
    });

    it('does not cause infinite fetch loops or redundant fetches on parent re-renders when params are stable', async () => {
      let fetchCount = 0;
      server.use(
        http.get('http://localhost:3000/api/tenant-1/appointments/search', () => {
          fetchCount++;
          return HttpResponse.json([]);
        })
      );

      // Render the hook initially
      const { result, rerender } = renderHook(
        ({ start, end }) => useAppointmentsByDateRange(start, end),
        { initialProps: { start: '2023-11-01', end: '2023-11-30' } }
      );

      // Wait for the initial reactive fetch to complete
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
      
      expect(fetchCount).toBe(1);

      // Simulate a parent component re-rendering (passing the exact same string primitives again)
      rerender({ start: '2023-11-01', end: '2023-11-30' });
      rerender({ start: '2023-11-01', end: '2023-11-30' });
      rerender({ start: '2023-11-01', end: '2023-11-30' });

      // Ensure no additional fetches were triggered by the re-renders
      expect(fetchCount).toBe(1);
    });
  });

  describe('useUpcomingAppointments', () => {
    it('fetches upcoming appointments reactively', async () => {
      server.use(
        http.get('http://localhost:3000/api/tenant-1/appointments/upcoming', ({ request }) => {
          const url = new URL(request.url);
          const limit = url.searchParams.get('limit');
          
          if (limit === '5') {
            return HttpResponse.json([
              {
                id: 'app-2',
                tenantId: 'tenant-1',
                clientId: 'client-2',
                assignedUserId: 'staff-1',
                scheduledAt: '2023-10-16T14:00:00.000Z',
                status: AppointmentStatus.CONFIRMED,
                history: []
              }
            ]);
          }
          return HttpResponse.json([]);
        })
      );

      const { result } = renderHook(() => useUpcomingAppointments(5));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.appointments.length).toBe(1);
      expect(result.current.appointments[0].id).toBe('app-2');
      expect(result.current.error).toBeNull();
    });
  });

  describe('useCreateAppointment', () => {
    it('creates appointment successfully', async () => {
      server.use(
        http.post('http://localhost:3000/api/tenant-1/appointments', () => {
          return HttpResponse.json({
            id: 'new-app-1',
            status: AppointmentStatus.SCHEDULED
          });
        })
      );

      // We'll import useCreateAppointment from the same file
      const { useCreateAppointment } = await import('./useAppointments');
      const { result } = renderHook(() => useCreateAppointment());

      let res: any;
      await act(async () => {
        res = await result.current.createAppointment({
          clientId: 'c1',
          assignedUserId: 'u1',
          scheduledAt: '2023-10-16T10:00:00.000Z'
        });
      });

      expect(res?.id).toBe('new-app-1');
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
    });
  });

  describe('useRescheduleAppointment', () => {
    it('reschedules appointment successfully', async () => {
      server.use(
        http.put('http://localhost:3000/api/tenant-1/appointments/app-1/reschedule', () => {
          return HttpResponse.json({ message: 'Success' });
        })
      );

      const { useRescheduleAppointment } = await import('./useAppointments');
      const { result } = renderHook(() => useRescheduleAppointment());

      await act(async () => {
        await result.current.rescheduleAppointment('app-1', {
          newDate: '2023-10-17T10:00:00.000Z',
          reason: 'Conflict'
        });
      });

      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
    });
  });

  describe('useCancelAppointment', () => {
    it('cancels appointment successfully', async () => {
      server.use(
        http.put('http://localhost:3000/api/tenant-1/appointments/app-1/cancel', () => {
          return HttpResponse.json({ message: 'Success' });
        })
      );

      const { useCancelAppointment } = await import('./useAppointments');
      const { result } = renderHook(() => useCancelAppointment());

      await act(async () => {
        await result.current.cancelAppointment('app-1', {
          reason: 'Sick'
        });
      });

      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
    });
  });

  describe('useUpdateAppointmentStatus', () => {
    it('updates status successfully', async () => {
      server.use(
        http.put('http://localhost:3000/api/tenant-1/appointments/app-1/status', () => {
          return HttpResponse.json({ message: 'Success' });
        })
      );

      const { useUpdateAppointmentStatus } = await import('./useAppointments');
      const { result } = renderHook(() => useUpdateAppointmentStatus());

      await act(async () => {
        await result.current.updateStatus('app-1', {
          status: AppointmentStatus.COMPLETED
        });
      });

      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
    });
  });

  describe('useAppointmentHistory', () => {
    it('fetches history successfully', async () => {
      server.use(
        http.get('http://localhost:3000/api/tenant-1/appointments/app-1/history', () => {
          return HttpResponse.json([
            { id: 'log-1', action: 'CREATED', timestamp: '2023-10-10T10:00:00.000Z' }
          ]);
        })
      );

      const { useAppointmentHistory } = await import('./useAppointments');
      const { result } = renderHook(() => useAppointmentHistory('app-1'));

      await act(async () => {
        await result.current.fetchHistory();
      });

      expect(result.current.history?.length).toBe(1);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
    });
  });
});
