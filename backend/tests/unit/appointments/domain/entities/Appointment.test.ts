import { Appointment } from '../../../../../src/appointments/domain/entities/Appointment';
import { AppointmentStatus } from '../../../../../src/appointments/domain/enums/AppointmentStatus';
import { DomainError } from '../../../../../src/shared/domain/errors/DomainError';

describe('Appointment Entity', () => {
  const validProps = {
    id: 'appt-1',
    tenantId: 'tenant-1',
    clientTenantId: 'tenant-1',
    assignedUserTenantId: 'tenant-1',
    clientId: 'client-1',
    assignedUserId: 'user-1',
    scheduledAt: new Date(Date.now() + 86400000), // Tomorrow
    notes: 'Initial consultation',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  describe('Creation and Cross-Tenant Validation', () => {
    it('should create an appointment with valid cross-tenant IDs', () => {
      const appointment = Appointment.create(validProps);
      expect(appointment.id).toBe('appt-1');
      expect(appointment.status).toBe(AppointmentStatus.SCHEDULED);
      expect(appointment.tenantId).toBe('tenant-1');
    });

    it('should reject creation if client belongs to a different tenant', () => {
      expect(() => {
        Appointment.create({
          ...validProps,
          clientTenantId: 'tenant-2', // Mismatch!
        });
      }).toThrow(DomainError);
      expect(() => {
        Appointment.create({
          ...validProps,
          clientTenantId: 'tenant-2',
        });
      }).toThrow('Client does not belong to this tenant');
    });

    it('should reject creation if assigned staff belongs to a different tenant', () => {
      expect(() => {
        Appointment.create({
          ...validProps,
          assignedUserTenantId: 'tenant-2', // Mismatch!
        });
      }).toThrow(DomainError);
      expect(() => {
        Appointment.create({
          ...validProps,
          assignedUserTenantId: 'tenant-2',
        });
      }).toThrow('Assigned user does not belong to this tenant');
    });
  });

  describe('Status Transition Graph', () => {
    let appointment: Appointment;

    beforeEach(() => {
      appointment = Appointment.create(validProps);
    });

    it('should transition from SCHEDULED to CONFIRMED', () => {
      appointment.confirm();
      expect(appointment.status).toBe(AppointmentStatus.CONFIRMED);
    });

    it('should transition from CONFIRMED to COMPLETED', () => {
      appointment.confirm();
      appointment.complete();
      expect(appointment.status).toBe(AppointmentStatus.COMPLETED);
    });

    it('should NOT transition from SCHEDULED to COMPLETED directly', () => {
      expect(() => {
        appointment.complete();
      }).toThrow(DomainError);
      expect(() => {
        appointment.complete();
      }).toThrow('Cannot complete an unconfirmed appointment');
    });

    it('should transition from SCHEDULED to CANCELLED', () => {
      appointment.cancel('Client requested', 'user-1');
      expect(appointment.status).toBe(AppointmentStatus.CANCELLED);
    });

    it('should transition from CONFIRMED to CANCELLED', () => {
      appointment.confirm();
      appointment.cancel('Client requested', 'user-1');
      expect(appointment.status).toBe(AppointmentStatus.CANCELLED);
    });

    it('should NOT transition out of CANCELLED (Terminal State)', () => {
      appointment.cancel('Client requested', 'user-1');
      
      expect(() => appointment.confirm()).toThrow(DomainError);
      expect(() => appointment.complete()).toThrow(DomainError);
      expect(() => appointment.reschedule(new Date(), 'New time', 'user-1')).toThrow(DomainError);
    });

    it('should NOT transition out of COMPLETED (Terminal State)', () => {
      appointment.confirm();
      appointment.complete();
      
      expect(() => appointment.cancel('No longer needed', 'user-1')).toThrow(DomainError);
      expect(() => appointment.reschedule(new Date(), 'New time', 'user-1')).toThrow(DomainError);
    });
  });

  describe('Rescheduling', () => {
    let appointment: Appointment;
    const initialDate = new Date(Date.now() + 86400000); // Tomorrow

    beforeEach(() => {
      appointment = Appointment.create({
        ...validProps,
        scheduledAt: initialDate,
      });
    });

    it('should update scheduledAt and append to history on reschedule without changing status', () => {
      const newDate = new Date(Date.now() + 172800000); // Day after tomorrow
      appointment.reschedule(newDate, 'Conflict', 'user-1');

      expect(appointment.scheduledAt).toEqual(newDate);
      expect(appointment.status).toBe(AppointmentStatus.SCHEDULED); // Should retain initial status
      expect(appointment.history).toHaveLength(1);
      
      const log = appointment.history[0];
      expect(log.previousDate).toEqual(initialDate);
      expect(log.newDate).toEqual(newDate);
      expect(log.reason).toBe('Conflict');
      expect(log.changedBy).toBe('user-1');
    });

    it('should allow multiple reschedules, retaining full history', () => {
      const date2 = new Date(Date.now() + 172800000);
      appointment.reschedule(date2, 'Conflict 1', 'user-1');
      
      const date3 = new Date(Date.now() + 259200000);
      appointment.reschedule(date3, 'Conflict 2', 'user-1');

      expect(appointment.scheduledAt).toEqual(date3);
      expect(appointment.status).toBe(AppointmentStatus.SCHEDULED); // Should retain initial status
      expect(appointment.history).toHaveLength(2);
      
      expect(appointment.history[0].previousDate).toEqual(initialDate);
      expect(appointment.history[0].newDate).toEqual(date2);
      
      expect(appointment.history[1].previousDate).toEqual(date2);
      expect(appointment.history[1].newDate).toEqual(date3);
    });

    it('should allow CONFIRMED appointment to be rescheduled and retain CONFIRMED status', () => {
      appointment.confirm();
      const newDate = new Date(Date.now() + 172800000);
      appointment.reschedule(newDate, 'Conflict', 'user-1');
      
      expect(appointment.scheduledAt).toEqual(newDate);
      expect(appointment.status).toBe(AppointmentStatus.CONFIRMED); // Proves CONFIRMED remains CONFIRMED
    });
  });
});
