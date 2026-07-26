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
        // The previous `as any` cast hid this line from type-aware searches for
        // auth reads, and silenced the fact that req.user is optional. Both
        // authenticate and authorize run first, so this is unreachable in
        // practice — but it is checked rather than asserted away, so a future
        // remount of this route without authenticate fails closed with a 401
        // instead of passing `undefined` in as the caller's role.
        if (!req.user) {
          return res.status(401).json({ error: 'Access denied. No token provided.' });
        }
        const callerRole = req.user.role;
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
