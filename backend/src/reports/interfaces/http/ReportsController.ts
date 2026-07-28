import { Request, Response, NextFunction } from 'express';
import { requireTenantId } from "@main/interfaces/http/tenantContext";
import { GetRevenueReportUseCase } from '../../application/use-cases/GetRevenueReportUseCase';
import { GetClientReportUseCase } from '../../application/use-cases/GetClientReportUseCase';
import { GetInventoryReportUseCase } from '../../application/use-cases/GetInventoryReportUseCase';
import { GetAppointmentReportUseCase } from '../../application/use-cases/GetAppointmentReportUseCase';
import { GetClientTrendUseCase } from '../../application/use-cases/GetClientTrendUseCase';
import { GetLowStockReportUseCase } from '../../application/use-cases/GetLowStockReportUseCase';

export class ReportsController {
  constructor(
    private readonly getRevenueReport: GetRevenueReportUseCase,
    private readonly getClientReport: GetClientReportUseCase,
    private readonly getInventoryReport: GetInventoryReportUseCase,
    private readonly getAppointmentReport: GetAppointmentReportUseCase,
    // `...UseCase` suffix on this one because the handler below is already
    // called `getClientTrend`, and the two would otherwise collide on the
    // instance.
    private readonly getClientTrendUseCase: GetClientTrendUseCase,
    private readonly getLowStockReport: GetLowStockReportUseCase
  ) {}

  getRevenue = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const tenantId = requireTenantId(req);
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 12;
      
      const data = await this.getRevenueReport.execute(tenantId, limit);
      res.status(200).json({ revenue: data });
    } catch (error) {
      next(error);
    }
  };

  getClients = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const tenantId = requireTenantId(req);
      const data = await this.getClientReport.execute(tenantId);
      res.status(200).json({ clients: data });
    } catch (error) {
      next(error);
    }
  };

  getInventory = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const tenantId = requireTenantId(req);
      const data = await this.getInventoryReport.execute(tenantId);
      res.status(200).json({ inventory: data });
    } catch (error) {
      next(error);
    }
  };

  /** §6.7 appointment statistics: counts by status, plus a per-staff breakdown. */
  getAppointments = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const tenantId = requireTenantId(req);
      const data = await this.getAppointmentReport.execute(tenantId, {
        from: parseDate(req.query.from),
        to: parseDate(req.query.to),
        assignedUserId: req.query.assignedUserId
          ? String(req.query.assignedUserId)
          : undefined,
      });
      res.status(200).json(data);
    } catch (error) {
      next(error);
    }
  };

  /** §6.7 new-client trend. */
  getClientTrend = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const tenantId = requireTenantId(req);
      const months = req.query.months ? parseInt(String(req.query.months), 10) : undefined;
      const data = await this.getClientTrendUseCase.execute(tenantId, months);
      res.status(200).json({ trend: data });
    } catch (error) {
      next(error);
    }
  };

  /** §6.7 list of low-stock or unavailable items, per location. */
  getLowStock = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const tenantId = requireTenantId(req);
      const data = await this.getLowStockReport.execute(tenantId);
      res.status(200).json(data);
    } catch (error) {
      next(error);
    }
  };
}

/**
 * Query-string date, or undefined.
 *
 * An unparseable value becomes undefined rather than an Invalid Date: the
 * latter silently poisons a Prisma `gte` and returns an empty report, which
 * reads to the user as "you have no appointments" instead of "that filter was
 * nonsense".
 */
function parseDate(raw: unknown): Date | undefined {
  if (raw === undefined || raw === null || raw === '') return undefined;
  const parsed = new Date(String(raw));
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
}
