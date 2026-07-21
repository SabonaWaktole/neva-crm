import { Request, Response, Router } from 'express';
import { CreateQuotationUseCase } from '../../application/use-cases/CreateQuotationUseCase';
import { UpdateQuotationUseCase } from '../../application/use-cases/UpdateQuotationUseCase';
import { SubmitQuotationUseCase } from '../../application/use-cases/SubmitQuotationUseCase';
import { ApproveQuotationUseCase } from '../../application/use-cases/ApproveQuotationUseCase';
import { ReturnQuotationToDraftUseCase } from '../../application/use-cases/ReturnQuotationToDraftUseCase';
import { MarkQuotationAcceptedUseCase } from '../../application/use-cases/MarkQuotationAcceptedUseCase';
import { MarkQuotationRejectedUseCase } from '../../application/use-cases/MarkQuotationRejectedUseCase';
import { ExpireQuotationUseCase } from '../../application/use-cases/ExpireQuotationUseCase';
import { SearchQuotationsUseCase } from '../../application/use-cases/SearchQuotationsUseCase';
import { GetQuotationDetailUseCase } from '../../application/use-cases/GetQuotationDetailUseCase';
import { GetPendingApprovalsUseCase } from '../../application/use-cases/GetPendingApprovalsUseCase';
import { QuotationStatus } from '../../domain/Quotation';
import { SettingsService } from '../../../settings/SettingsService';

export class QuotationsController {
  public router = Router();

  constructor(
    private createQuotationUseCase: CreateQuotationUseCase,
    private updateQuotationUseCase: UpdateQuotationUseCase,
    private submitQuotationUseCase: SubmitQuotationUseCase,
    private approveQuotationUseCase: ApproveQuotationUseCase,
    private returnQuotationToDraftUseCase: ReturnQuotationToDraftUseCase,
    private markQuotationAcceptedUseCase: MarkQuotationAcceptedUseCase,
    private markQuotationRejectedUseCase: MarkQuotationRejectedUseCase,
    private expireQuotationUseCase: ExpireQuotationUseCase,
    private searchQuotationsUseCase: SearchQuotationsUseCase,
    private getQuotationDetailUseCase: GetQuotationDetailUseCase,
    private getPendingApprovalsUseCase: GetPendingApprovalsUseCase,
    private settingsService: SettingsService
  ) {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.post('/', this.createQuotation.bind(this));
    this.router.get('/', this.searchQuotations.bind(this));
    this.router.get('/pending-approvals', this.getPendingApprovals.bind(this));
    this.router.get('/:id', this.getQuotationDetail.bind(this));
    this.router.put('/:id', this.updateQuotation.bind(this));
    this.router.post('/:id/submit', this.submitQuotation.bind(this));
    this.router.post('/:id/approve', this.approveQuotation.bind(this));
    this.router.post('/:id/return-to-draft', this.returnToDraft.bind(this));
    this.router.post('/:id/mark-accepted', this.markAccepted.bind(this));
    this.router.post('/:id/mark-rejected', this.markRejected.bind(this));
    this.router.post('/:id/expire', this.expireQuotation.bind(this));
  }

  private async createQuotation(req: Request, res: Response) {
    try {
      const tenantId = req.user!.tenantId!;
      const { clientId, lineItems } = req.body;
      const result = await this.createQuotationUseCase.execute({
        tenantId,
        clientId,
        createdByUserId: req.user!.userId,
        authorRole: req.user!.role,
        lineItems
      });
      res.status(201).json(result.quotation);
    } catch (error: any) {
      if (error.message.includes('Unauthorized')) return res.status(403).json({ error: error.message });
      res.status(400).json({ error: error.message });
    }
  }

  private async updateQuotation(req: Request, res: Response) {
    try {
      const tenantId = req.user!.tenantId!;
      const id = req.params.id as string;
      const { lineItems } = req.body;
      const result = await this.updateQuotationUseCase.execute({
        tenantId,
        quotationId: id,
        actingUserId: req.user!.userId,
        actingUserRole: req.user!.role,
        lineItems
      });
      res.json(result.quotation);
    } catch (error: any) {
      if (error.message.includes('not found')) return res.status(404).json({ error: error.message });
      if (error.message.includes('Unauthorized')) return res.status(403).json({ error: error.message });
      res.status(400).json({ error: error.message });
    }
  }

  private async submitQuotation(req: Request, res: Response) {
    try {
      const tenantId = req.user!.tenantId!;
      const id = req.params.id as string;
      
      const requiresApproval = await this.settingsService.getRequiresQuotationApproval(tenantId);

      const result = await this.submitQuotationUseCase.execute({
        tenantId,
        quotationId: id,
        actingUserId: req.user!.userId,
        actingUserRole: req.user!.role,
        requiresQuotationApproval: requiresApproval
      });
      res.json(result.quotation);
    } catch (error: any) {
      if (error.message.includes('not found')) return res.status(404).json({ error: error.message });
      if (error.message.includes('Unauthorized')) return res.status(403).json({ error: error.message });
      res.status(400).json({ error: error.message });
    }
  }

  private async approveQuotation(req: Request, res: Response) {
    try {
      const tenantId = req.user!.tenantId!;
      const id = req.params.id as string;
      const result = await this.approveQuotationUseCase.execute({
        tenantId,
        quotationId: id,
        actingUserId: req.user!.userId,
        actingUserRole: req.user!.role
      });
      res.json(result.quotation);
    } catch (error: any) {
      if (error.message.includes('not found')) return res.status(404).json({ error: error.message });
      if (error.message.includes('Unauthorized')) return res.status(403).json({ error: error.message });
      res.status(400).json({ error: error.message });
    }
  }

  private async returnToDraft(req: Request, res: Response) {
    try {
      const tenantId = req.user!.tenantId!;
      const id = req.params.id as string;
      const { reason } = req.body;
      const result = await this.returnQuotationToDraftUseCase.execute({
        tenantId,
        quotationId: id,
        actingUserId: req.user!.userId,
        actingUserRole: req.user!.role,
        reason
      });
      res.json(result.quotation);
    } catch (error: any) {
      if (error.message.includes('not found')) return res.status(404).json({ error: error.message });
      if (error.message.includes('Unauthorized')) return res.status(403).json({ error: error.message });
      res.status(400).json({ error: error.message });
    }
  }

  private async markAccepted(req: Request, res: Response) {
    try {
      const tenantId = req.user!.tenantId!;
      const id = req.params.id as string;
      const result = await this.markQuotationAcceptedUseCase.execute({
        tenantId,
        quotationId: id,
        actingUserId: req.user!.userId,
        actingUserRole: req.user!.role
      });
      res.json(result.quotation);
    } catch (error: any) {
      if (error.message.includes('not found')) return res.status(404).json({ error: error.message });
      if (error.message.includes('Unauthorized')) return res.status(403).json({ error: error.message });
      res.status(400).json({ error: error.message });
    }
  }

  private async markRejected(req: Request, res: Response) {
    try {
      const tenantId = req.user!.tenantId!;
      const id = req.params.id as string;
      const result = await this.markQuotationRejectedUseCase.execute({
        tenantId,
        quotationId: id,
        actingUserId: req.user!.userId,
        actingUserRole: req.user!.role
      });
      res.json(result.quotation);
    } catch (error: any) {
      if (error.message.includes('not found')) return res.status(404).json({ error: error.message });
      if (error.message.includes('Unauthorized')) return res.status(403).json({ error: error.message });
      res.status(400).json({ error: error.message });
    }
  }

  private async expireQuotation(req: Request, res: Response) {
    try {
      const tenantId = req.user!.tenantId!;
      const id = req.params.id as string;
      const result = await this.expireQuotationUseCase.execute({
        tenantId,
        quotationId: id,
        actingUserId: req.user!.userId,
        actingUserRole: req.user!.role
      });
      res.json(result.quotation);
    } catch (error: any) {
      if (error.message.includes('not found')) return res.status(404).json({ error: error.message });
      if (error.message.includes('Unauthorized')) return res.status(403).json({ error: error.message });
      res.status(400).json({ error: error.message });
    }
  }

  private async searchQuotations(req: Request, res: Response) {
    try {
      const tenantId = req.user!.tenantId!;
      const { query, status, clientId, page, limit } = req.query;

      const result = await this.searchQuotationsUseCase.execute({
        tenantId,
        actingUserId: req.user!.userId,
        actingUserRole: req.user!.role,
        params: {
          query: query as string,
          status: status as QuotationStatus,
          clientId: clientId as string,
          page: page ? parseInt(page as string, 10) : undefined,
          limit: limit ? parseInt(limit as string, 10) : undefined
        }
      });
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  private async getPendingApprovals(req: Request, res: Response) {
    try {
      const tenantId = req.user!.tenantId!;
      const result = await this.getPendingApprovalsUseCase.execute({
        tenantId,
        actingUserRole: req.user!.role
      });
      res.json(result.quotations);
    } catch (error: any) {
      if (error.message.includes('Unauthorized')) return res.status(403).json({ error: error.message });
      res.status(400).json({ error: error.message });
    }
  }

  private async getQuotationDetail(req: Request, res: Response) {
    try {
      const tenantId = req.user!.tenantId!;
      const id = req.params.id as string;
      const result = await this.getQuotationDetailUseCase.execute({
        tenantId,
        quotationId: id,
        actingUserId: req.user!.userId,
        actingUserRole: req.user!.role
      });
      res.json(result);
    } catch (error: any) {
      if (error.message.includes('not found')) return res.status(404).json({ error: error.message });
      if (error.message.includes('Unauthorized')) return res.status(403).json({ error: error.message });
      res.status(400).json({ error: error.message });
    }
  }
}
