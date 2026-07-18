import { Router, Request, Response, NextFunction } from 'express';
import { GetTenantsUseCase } from '../../../application/use-cases/GetTenantsUseCase';
import { authenticate } from '../../../../main/interfaces/http/middlewares/authenticate';
import { authorize } from '../../../../main/interfaces/http/middlewares/authorize';
import { UserRole } from '../../../../auth/domain/enums/UserRole';
import { ITokenService } from '../../../../auth/application/ports/ITokenService';

export function createTenantRouter(
  getTenantsUseCase: GetTenantsUseCase,
  tokenService: ITokenService
): Router {
  const router = Router();

  // SUPER_ADMIN only: Get all tenants
  router.get('/', 
    authenticate(tokenService), 
    authorize([UserRole.SUPER_ADMIN]),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const callerRole = (req as any).user?.role;
        const skip = req.query.skip ? parseInt(req.query.skip as string, 10) : undefined;
        const take = req.query.take ? parseInt(req.query.take as string, 10) : undefined;

        const result = await getTenantsUseCase.execute({ callerRole, skip, take });

        res.json({
          items: result.items.map(t => ({
            id: t.id,
            name: t.name,
            urlSlug: t.urlSlug,
            createdAt: t.createdAt
          })),
          total: result.total
        });
      } catch (error) {
        next(error);
      }
    }
  );

  return router;
}
