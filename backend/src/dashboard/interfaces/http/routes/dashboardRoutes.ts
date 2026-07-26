import { Router, Request, Response, NextFunction } from 'express';
import { GetTenantClientMetricsUseCase } from '../../../application/use-cases/GetTenantClientMetricsUseCase';
import { GetTenantActivityFeedUseCase } from '../../../application/use-cases/GetTenantActivityFeedUseCase';
import { authenticate } from '../../../../main/interfaces/http/middlewares/authenticate';
import { authorize } from '../../../../main/interfaces/http/middlewares/authorize';
import { resolveTenant } from '../../../../main/interfaces/http/middlewares/resolveTenant';
import { requireTenant, requireTenantId } from '../../../../main/interfaces/http/tenantContext';
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
        // The tenant is already resolved on the request by resolveTenant, so
        // its timezone comes along without an extra read.
        const result = await metricsUseCase.execute({
          tenantId: requireTenantId(req),
          timeZone: requireTenant(req).timezone,
          userId: req.user!.userId,
          role: req.user!.role,
        });
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
        const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : undefined;

        // Both identity and role are passed through; the use case decides what
        // each role may see, so the policy stays in one place.
        const result = await feedUseCase.execute({
          tenantId: requireTenantId(req),
          userId: req.user!.userId,
          role: req.user!.role,
          limit,
        });
        res.json(result);
      } catch (error) {
        next(error);
      }
    }
  );

  return router;
}
