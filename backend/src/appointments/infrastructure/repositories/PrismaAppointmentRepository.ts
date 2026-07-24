import { PrismaClient, Prisma } from '@prisma/client';
import { IAppointmentRepository, SearchAppointmentsFilters } from '../../domain/repositories/IAppointmentRepository';
import { Appointment, RescheduleLog } from '../../domain/entities/Appointment';
import { AppointmentStatus } from '../../domain/enums/AppointmentStatus';

export class PrismaAppointmentRepository implements IAppointmentRepository {
  constructor(private prisma: PrismaClient) {}

  private mapToDomain(record: any): Appointment {
    const history: RescheduleLog[] = (record.auditLogs || []).map((log: any) => ({
      id: log.id,
      previousDate: log.previousDate,
      newDate: log.newDate,
      reason: log.reason,
      changedBy: log.changedBy,
      createdAt: log.createdAt,
    }));

    // Reconstitute the Appointment using the static create method.
    // For reconstitution, we trust the DB state, so we pass the appointment's tenantId 
    // as the clientTenantId and assignedUserTenantId to bypass cross-tenant validation errors.
    return Appointment.create({
      id: record.id,
      tenantId: record.tenantId,
      clientId: record.clientId,
      assignedUserId: record.assignedUserId,
      scheduledAt: record.scheduledAt,
      status: record.status as AppointmentStatus,
      notes: record.notes || undefined,
      history: history,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
      clientTenantId: record.tenantId,
      assignedUserTenantId: record.tenantId,
    });
  }

  async findById(id: string, tenantId: string): Promise<Appointment | null> {
    const record = await this.prisma.appointment.findFirst({
      where: { id, tenantId },
      include: { auditLogs: { orderBy: { createdAt: 'asc' } } }
    });
    if (!record) return null;
    return this.mapToDomain(record);
  }

  async findByClientId(clientId: string, tenantId: string): Promise<Appointment[]> {
    const records = await this.prisma.appointment.findMany({
      where: { clientId, tenantId },
      include: { auditLogs: { orderBy: { createdAt: 'asc' } } },
      orderBy: { scheduledAt: 'desc' }
    });
    return records.map(r => this.mapToDomain(r));
  }

  async findByDateRange(tenantId: string, startDate: Date, endDate: Date, filters?: SearchAppointmentsFilters): Promise<Appointment[]> {
    const where: Prisma.AppointmentWhereInput = {
      tenantId,
      scheduledAt: {
        gte: startDate,
        lte: endDate,
      }
    };

    if (filters?.clientId) where.clientId = filters.clientId;
    if (filters?.assignedUserId) where.assignedUserId = filters.assignedUserId;
    if (filters?.status) where.status = filters.status;

    const records = await this.prisma.appointment.findMany({
      where,
      include: { auditLogs: { orderBy: { createdAt: 'asc' } } },
      orderBy: { scheduledAt: 'asc' }
    });

    return records.map(r => this.mapToDomain(r));
  }

  async findUpcoming(tenantId: string, assignedUserId?: string, limit?: number): Promise<Appointment[]> {
    const where: Prisma.AppointmentWhereInput = {
      tenantId,
      scheduledAt: { gt: new Date() },
      status: { in: ['SCHEDULED', 'CONFIRMED'] }
    };

    if (assignedUserId) {
      where.assignedUserId = assignedUserId;
    }

    const records = await this.prisma.appointment.findMany({
      where,
      take: limit,
      include: { auditLogs: { orderBy: { createdAt: 'asc' } } },
      orderBy: { scheduledAt: 'asc' }
    });

    return records.map(r => this.mapToDomain(r));
  }

  async findRecentByTenant(tenantId: string, limit: number, assignedUserId?: string): Promise<Appointment[]> {
    const where: Prisma.AppointmentWhereInput = { tenantId };
    
    if (assignedUserId) {
      where.assignedUserId = assignedUserId;
    }

    const records = await this.prisma.appointment.findMany({
      where,
      take: limit,
      include: { auditLogs: { orderBy: { createdAt: 'asc' } } },
      orderBy: { updatedAt: 'desc' }
    });

    return records.map(r => this.mapToDomain(r));
  }

  async save(appointment: Appointment): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      await tx.appointment.create({
        data: {
          id: appointment.id,
          tenantId: appointment.tenantId,
          clientId: appointment.clientId,
          assignedUserId: appointment.assignedUserId,
          scheduledAt: appointment.scheduledAt,
          status: appointment.status,
          notes: appointment.notes,
          createdAt: appointment.createdAt,
          updatedAt: appointment.updatedAt,
        }
      });

      if (appointment.history.length > 0) {
        await tx.appointmentAuditLog.createMany({
          data: appointment.history.map(log => ({
            appointmentId: appointment.id,
            previousDate: log.previousDate,
            newDate: log.newDate,
            reason: log.reason,
            changedBy: log.changedBy,
            createdAt: log.createdAt || new Date(),
          }))
        });
      }
    });
  }

  async update(appointment: Appointment): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      await tx.appointment.update({
        where: { id: appointment.id },
        data: {
          clientId: appointment.clientId,
          assignedUserId: appointment.assignedUserId,
          scheduledAt: appointment.scheduledAt,
          status: appointment.status,
          notes: appointment.notes,
          updatedAt: appointment.updatedAt,
        }
      });

      // Simple implementation: replace all logs
      await tx.appointmentAuditLog.deleteMany({
        where: { appointmentId: appointment.id }
      });

      if (appointment.history.length > 0) {
        await tx.appointmentAuditLog.createMany({
          data: appointment.history.map(log => ({
            appointmentId: appointment.id,
            previousDate: log.previousDate,
            newDate: log.newDate,
            reason: log.reason,
            changedBy: log.changedBy,
            createdAt: log.createdAt || new Date(),
          }))
        });
      }
    });
  }
}
