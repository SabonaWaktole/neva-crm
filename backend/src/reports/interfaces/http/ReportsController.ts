import { Request, Response, NextFunction } from 'express';
import { GetRevenueReportUseCase } from '../../application/use-cases/GetRevenueReportUseCase';
import { GetClientReportUseCase } from '../../application/use-cases/GetClientReportUseCase';
import { GetInventoryReportUseCase } from '../../application/use-cases/GetInventoryReportUseCase';
export class ReportsController {
  constructor(
    private readonly getRevenueReport: GetRevenueReportUseCase,
    private readonly getClientReport: GetClientReportUseCase,
    private readonly getInventoryReport: GetInventoryReportUseCase
  ) {}

  getRevenue = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const tenantId = req.tenant!.id;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 12;
      
      const data = await this.getRevenueReport.execute(tenantId, limit);
      res.status(200).json({ revenue: data });
    } catch (error) {
      next(error);
    }
  };

  getClients = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const tenantId = req.tenant!.id;
      const data = await this.getClientReport.execute(tenantId);
      res.status(200).json({ clients: data });
    } catch (error) {
      next(error);
    }
  };

  getInventory = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const tenantId = req.tenant!.id;
      const data = await this.getInventoryReport.execute(tenantId);
      res.status(200).json({ inventory: data });
    } catch (error) {
      next(error);
    }
  };
}
