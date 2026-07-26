import { Request, Response, Router } from 'express';
import { ITenantRepository } from '../../../tenant/domain/repositories/ITenantRepository';
import { UserRole } from '../../../auth/domain/enums/UserRole';

export class SettingsController {
  public router = Router({ mergeParams: true });

  constructor(private tenantRepository: ITenantRepository) {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.get('/', this.getSettings.bind(this));
    this.router.put('/', this.updateSettings.bind(this));
  }

  private async getSettings(req: Request, res: Response) {
    try {
      const tenantId = req.user!.tenantId!;
      const tenant = await this.tenantRepository.findById(tenantId);
      if (!tenant) {
        return res.status(404).json({ error: 'Tenant not found' });
      }
      // Branding URLs are read directly from Prisma — they are presentation
      // strings with no domain behaviour, so they are not carried on the
      // Tenant entity. See the same note in AuthController.getMe.
      const { prisma } = require('../../../shared/infrastructure/prisma/client');
      const branding = await prisma.tenant.findUnique({
        where: { id: tenantId },
        select: { logoUrl: true, coverImageUrl: true },
      });

      res.json({
        requiresQuotationApproval: tenant.requiresQuotationApproval,
        logoUrl: branding?.logoUrl ?? null,
        coverImageUrl: branding?.coverImageUrl ?? null,
      });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  private async updateSettings(req: Request, res: Response) {
    try {
      const tenantId = req.user!.tenantId!;
      const user = req.user!;
      
      // Role-gate settings update to Business Owner only
      if (user.role !== UserRole.BUSINESS_OWNER) {
        return res.status(403).json({ error: 'Unauthorized: Only Business Owners can update settings' });
      }

      const { requiresQuotationApproval } = req.body;
      const tenant = await this.tenantRepository.findById(tenantId);
      
      if (!tenant) {
        return res.status(404).json({ error: 'Tenant not found' });
      }

      await this.tenantRepository.updateSettings(tenantId, {
        requiresQuotationApproval: Boolean(requiresQuotationApproval)
      });
      
      res.json({
        requiresQuotationApproval: Boolean(requiresQuotationApproval)
      });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
}
