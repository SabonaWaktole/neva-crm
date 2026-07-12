import { z } from 'zod';
import { AppointmentStatus } from '../../../domain/enums/AppointmentStatus';

export const createAppointmentSchema = z.object({
  clientId: z.string().min(1, 'Client ID is required'),
  assignedUserId: z.string().min(1, 'Assigned user ID is required'),
  scheduledAt: z.coerce.date().refine(
    (date) => date > new Date(),
    { message: 'Scheduled date must be in the future' }
  ),
  notes: z.string().optional(),
});

export const rescheduleAppointmentSchema = z.object({
  newDate: z.coerce.date().refine(
    (date) => date > new Date(),
    { message: 'New date must be in the future' }
  ),
  reason: z.string().min(1, 'Reason is required'),
});

export const cancelAppointmentSchema = z.object({
  reason: z.string().min(1, 'Reason is required'),
});

export const updateAppointmentStatusSchema = z.object({
  status: z.enum(['CONFIRMED', 'COMPLETED'], {
    errorMap: () => ({ message: 'Status must be CONFIRMED or COMPLETED' }),
  }),
});

export const searchAppointmentsSchema = z.object({
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  clientId: z.string().optional(),
  assignedUserId: z.string().optional(),
  status: z.nativeEnum(AppointmentStatus).optional(),
}).refine(
  (data) => data.endDate > data.startDate,
  { message: 'End date must be after start date', path: ['endDate'] }
);

export const getUpcomingAppointmentsSchema = z.object({
  limit: z.coerce.number().min(1).max(50).default(5),
});
