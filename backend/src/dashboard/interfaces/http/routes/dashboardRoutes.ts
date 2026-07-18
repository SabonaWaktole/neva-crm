import { Router, Request, Response, NextFunction } from 'express';
import { GetTenantClientMetricsUseCase } from '../../../application/use-cases/GetTenantClientMetricsUseCase';
import { GetTenantActivityFeedUseCase } from '../../../application/use-cases/GetTenantActivityFeedUseCase';
import { authenticate } from '../../../../main/interfaces/http/middlewares/authenticate';
import { authorize } from '../../../../main/interfaces/http/middlewares/authorize';
import { resolveTenant } from '../../../../main/interfaces/http/middlewares/resolveTenant';
import { UserRole } from '../../../../auth/domain/enums/UserRole';
import { ITokenService } from '../../../../auth/application/ports/ITokenService';
import { ITenantRepository } from '../../../../tenant/domain/repositories/ITenantRepository';

export function createDashboardRouter(
  metricsUseCase: GetTenantClientMetricsUseCase,
  feedUseCase: GetTenantActivityFeedUseCase,
  tokenService: ITokenService,
  tenantRepository: ITenantRepository
): Router {
  const router = Router({ mergeParams: true }); // Important: to access :tenantSlug from parent router

  // Middleware chain for dashboard routes
  router.use(authenticate(tokenService));
  router.use(resolveTenant(tenantRepository));

  // GET /api/:tenantSlug/dashboard/metrics
  router.get('/metrics',
    authorize([UserRole.BUSINESS_OWNER, UserRole.STAFF]),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const tenantId = (req as any).tenant.id;
        const result = await metricsUseCase.execute(tenantId);
        res.json(result);
      } catch (error) {
        next(error);
      }
    }
  );

  // GET /api/:tenantSlug/dashboard/feed
  router.get('/feed',
    authorize([UserRole.BUSINESS_OWNER, UserRole.STAFF]),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const tenantId = (req as any).tenant.id;
        const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : undefined;
        // Staff see only their activity feed? The use case doesn't take userId, it's global for the tenant, 
        // but maybe we can just pass it. For now, we leave it. Wait, the use case accepts `userId`?
        // Ah, let's check the usecase. The feed usecase takes `tenantId`, `limit`. No userId.
        
        const result = await feedUseCase.execute({ tenantId, limit });
        res.json(result);
      } catch (error) {
        next(error);
      }
    }
  );

  return router;
}
