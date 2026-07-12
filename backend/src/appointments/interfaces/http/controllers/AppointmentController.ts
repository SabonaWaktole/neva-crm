import { Request, Response } from 'express';
import { CreateAppointmentUseCase } from '../../../application/use-cases/CreateAppointmentUseCase';
import { RescheduleAppointmentUseCase } from '../../../application/use-cases/RescheduleAppointmentUseCase';
import { CancelAppointmentUseCase } from '../../../application/use-cases/CancelAppointmentUseCase';
import { UpdateAppointmentStatusUseCase } from '../../../application/use-cases/UpdateAppointmentStatusUseCase';
import { SearchAppointmentsUseCase } from '../../../application/use-cases/SearchAppointmentsUseCase';
import { GetUpcomingAppointmentsUseCase } from '../../../application/use-cases/GetUpcomingAppointmentsUseCase';
import { GetAppointmentHistoryUseCase } from '../../../application/use-cases/GetAppointmentHistoryUseCase';
import { DomainError } from '../../../../shared/domain/errors/DomainError';
import {
  createAppointmentSchema,
  rescheduleAppointmentSchema,
  cancelAppointmentSchema,
  updateAppointmentStatusSchema,
  searchAppointmentsSchema,
  getUpcomingAppointmentsSchema,
} from '../schemas/appointmentSchemas';

export class AppointmentController {
  constructor(
    private createAppointmentUseCase: CreateAppointmentUseCase,
    private rescheduleAppointmentUseCase: RescheduleAppointmentUseCase,
    private cancelAppointmentUseCase: CancelAppointmentUseCase,
    private updateAppointmentStatusUseCase: UpdateAppointmentStatusUseCase,
    private searchAppointmentsUseCase: SearchAppointmentsUseCase,
    private getUpcomingAppointmentsUseCase: GetUpcomingAppointmentsUseCase,
    private getAppointmentHistoryUseCase: GetAppointmentHistoryUseCase
  ) {}

  public createAppointment = async (req: Request, res: Response) => {
    try {
      const validatedData = createAppointmentSchema.parse(req.body);
      const tenantId = req.tenant!.id;

      const appointment = await this.createAppointmentUseCase.execute({
        tenantId,
        ...validatedData,
      });

      res.status(201).json(appointment);
    } catch (error: any) {
      if (error.message.includes('not found')) {
        res.status(404).json({ error: error.message });
      } else if (error instanceof DomainError) {
        res.status(400).json({ error: error.message });
      } else {
        res.status(400).json({ error: error.message });
      }
    }
  };

  public rescheduleAppointment = async (req: Request, res: Response) => {
    try {
      const validatedData = rescheduleAppointmentSchema.parse(req.body);
      const tenantId = req.tenant!.id;
      const id = req.params.appointmentId as string;
      const changedByUserId = req.user!.userId;

      await this.rescheduleAppointmentUseCase.execute({
        id,
        tenantId,
        newDate: validatedData.newDate,
        reason: validatedData.reason,
        changedByUserId,
      });

      res.status(200).json({ message: 'Appointment rescheduled successfully' });
    } catch (error: any) {
      if (error.message.includes('not found')) {
        res.status(404).json({ error: error.message });
      } else if (error instanceof DomainError) {
        res.status(400).json({ error: error.message });
      } else {
        res.status(400).json({ error: error.message });
      }
    }
  };

  public cancelAppointment = async (req: Request, res: Response) => {
    try {
      const validatedData = cancelAppointmentSchema.parse(req.body);
      const tenantId = req.tenant!.id;
      const id = req.params.appointmentId as string;
      const changedByUserId = req.user!.userId;

      await this.cancelAppointmentUseCase.execute({
        id,
        tenantId,
        reason: validatedData.reason,
        changedByUserId,
      });

      res.status(200).json({ message: 'Appointment cancelled successfully' });
    } catch (error: any) {
      if (error.message.includes('not found')) {
        res.status(404).json({ error: error.message });
      } else if (error instanceof DomainError) {
        res.status(400).json({ error: error.message });
      } else {
        res.status(400).json({ error: error.message });
      }
    }
  };

  public updateAppointmentStatus = async (req: Request, res: Response) => {
    try {
      const validatedData = updateAppointmentStatusSchema.parse(req.body);
      const tenantId = req.tenant!.id;
      const id = req.params.appointmentId as string;

      await this.updateAppointmentStatusUseCase.execute({
        id,
        tenantId,
        status: validatedData.status,
      });

      res.status(200).json({ message: `Appointment marked as ${validatedData.status}` });
    } catch (error: any) {
      if (error.message.includes('not found')) {
        res.status(404).json({ error: error.message });
      } else if (error instanceof DomainError) {
        res.status(400).json({ error: error.message });
      } else {
        res.status(400).json({ error: error.message });
      }
    }
  };

  public searchAppointments = async (req: Request, res: Response) => {
    try {
      const validatedData = searchAppointmentsSchema.parse(req.query);
      const tenantId = req.tenant!.id;

      const results = await this.searchAppointmentsUseCase.execute({
        tenantId,
        startDate: validatedData.startDate,
        endDate: validatedData.endDate,
        filters: {
          clientId: validatedData.clientId,
          assignedUserId: validatedData.assignedUserId,
          status: validatedData.status,
        },
      });

      res.status(200).json(results);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  };

  public getUpcomingAppointments = async (req: Request, res: Response) => {
    try {
      const validatedData = getUpcomingAppointmentsSchema.parse(req.query);
      const tenantId = req.tenant!.id;
      const userId = req.user!.userId;
      const role = req.user!.role;

      const results = await this.getUpcomingAppointmentsUseCase.execute({
        tenantId,
        userId,
        role,
        limit: validatedData.limit,
      });

      res.status(200).json(results);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  };

  public getAppointmentHistory = async (req: Request, res: Response) => {
    try {
      const tenantId = req.tenant!.id;
      const id = req.params.appointmentId as string;

      const history = await this.getAppointmentHistoryUseCase.execute({
        id,
        tenantId,
      });

      res.status(200).json(history);
    } catch (error: any) {
      if (error.message.includes('not found')) {
        res.status(404).json({ error: error.message });
      } else if (error instanceof DomainError) {
        res.status(400).json({ error: error.message });
      } else {
        res.status(400).json({ error: error.message });
      }
    }
  };
}
