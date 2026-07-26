import { Request, Response, Router } from 'express';
import { requireTenantId } from "@main/interfaces/http/tenantContext";
import { ZodError } from 'zod';
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
import { SettingsService } from '../../../settings/SettingsService';
import {
  createQuotationSchema,
  updateQuotationSchema,
  searchQuotationsSchema,
  markAcceptedSchema,
  markRejectedSchema,
} from './schemas/quotationSchemas';

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
      const validatedData = createQuotationSchema.parse(req.body);
      const tenantId = requireTenantId(req);
      const result = await this.createQuotationUseCase.execute({
        tenantId,
        clientId: validatedData.clientId,
        createdByUserId: req.user!.userId,
        authorRole: req.user!.role,
        lineItems: validatedData.lineItems
      });
      res.status(201).json(result.quotation);
    } catch (error: any) {
      if (error instanceof ZodError) return res.status(400).json({ error: error.errors });
      if (error.message.includes('Unauthorized')) return res.status(403).json({ error: error.message });
      res.status(400).json({ error: error.message });
    }
  }

  private async updateQuotation(req: Request, res: Response) {
    try {
      const validatedData = updateQuotationSchema.parse(req.body);
      const tenantId = requireTenantId(req);
      const id = req.params.id as string;
      const result = await this.updateQuotationUseCase.execute({
        tenantId,
        quotationId: id,
        actingUserId: req.user!.userId,
        actingUserRole: req.user!.role,
        lineItems: validatedData.lineItems
      });
      res.json(result.quotation);
    } catch (error: any) {
      if (error instanceof ZodError) return res.status(400).json({ error: error.errors });
      if (error.message.includes('not found')) return res.status(404).json({ error: error.message });
      if (error.message.includes('Unauthorized')) return res.status(403).json({ error: error.message });
      res.status(400).json({ error: error.message });
    }
  }

  private async submitQuotation(req: Request, res: Response) {
    try {
      const tenantId = requireTenantId(req);
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
      const tenantId = requireTenantId(req);
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
      const tenantId = requireTenantId(req);
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
      markAcceptedSchema.parse(req.body);
      const tenantId = requireTenantId(req);
      const id = req.params.id as string;
      const result = await this.markQuotationAcceptedUseCase.execute({
        tenantId,
        quotationId: id,
        actingUserId: req.user!.userId,
        actingUserRole: req.user!.role
      });
      res.json(result.quotation);
    } catch (error: any) {
      if (error instanceof ZodError) return res.status(400).json({ error: error.errors });
      if (error.message.includes('not found')) return res.status(404).json({ error: error.message });
      if (error.message.includes('Unauthorized')) return res.status(403).json({ error: error.message });
      res.status(400).json({ error: error.message });
    }
  }

  private async markRejected(req: Request, res: Response) {
    try {
      markRejectedSchema.parse(req.body);
      const tenantId = requireTenantId(req);
      const id = req.params.id as string;
      const result = await this.markQuotationRejectedUseCase.execute({
        tenantId,
        quotationId: id,
        actingUserId: req.user!.userId,
        actingUserRole: req.user!.role
      });
      res.json(result.quotation);
    } catch (error: any) {
      if (error instanceof ZodError) return res.status(400).json({ error: error.errors });
      if (error.message.includes('not found')) return res.status(404).json({ error: error.message });
      if (error.message.includes('Unauthorized')) return res.status(403).json({ error: error.message });
      res.status(400).json({ error: error.message });
    }
  }

  private async expireQuotation(req: Request, res: Response) {
    try {
      const tenantId = requireTenantId(req);
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
      const validatedQuery = searchQuotationsSchema.parse(req.query);
      const tenantId = requireTenantId(req);

      const result = await this.searchQuotationsUseCase.execute({
        tenantId,
        actingUserId: req.user!.userId,
        actingUserRole: req.user!.role,
        params: {
          query: validatedQuery.query,
          status: validatedQuery.status,
          clientId: validatedQuery.clientId,
          page: validatedQuery.page,
          limit: validatedQuery.limit
        }
      });
      res.json(result);
    } catch (error: any) {
      if (error instanceof ZodError) return res.status(400).json({ error: error.errors });
      res.status(400).json({ error: error.message });
    }
  }

  private async getPendingApprovals(req: Request, res: Response) {
    try {
      const tenantId = requireTenantId(req);
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
      const tenantId = requireTenantId(req);
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
