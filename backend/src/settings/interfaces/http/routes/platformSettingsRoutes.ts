import { Router, Request, Response, NextFunction } from 'express';
import { authenticate } from '../../../../main/interfaces/http/middlewares/authenticate';
import { authorize } from '../../../../main/interfaces/http/middlewares/authorize';
import { validateRequest } from '../../../../main/interfaces/http/middlewares/validateRequest';
import { UserRole } from '../../../../auth/domain/enums/UserRole';
import { UnauthorizedError } from '../../../../auth/domain/errors';
import { ITokenService } from '../../../../auth/application/ports/ITokenService';
import { GetPlatformSettingsUseCase } from '../../../application/use-cases/GetPlatformSettingsUseCase';
import { UpdatePlatformSettingsUseCase } from '../../../application/use-cases/UpdatePlatformSettingsUseCase';
import { updatePlatformSettingsSchema } from '../schemas/platformSettingsSchemas';
import { InvalidPlatformSettingsError } from '../../../domain/PlatformSettings';

export interface PlatformSettingsRouterDeps {
  getPlatformSettingsUseCase: GetPlatformSettingsUseCase;
  updatePlatformSettingsUseCase: UpdatePlatformSettingsUseCase;
  tokenService: ITokenService;
}

/**
 * The default values a NEWLY provisioned workspace starts with — not a
 * per-tenant endpoint, so mounted at `/api/platform-settings` with no
 * `:tenantSlug`, alongside `/api/tenants`. `authorize([SUPER_ADMIN])` at the
 * router level, matching that router's own reasoning: a route added here later
 * cannot be left unguarded by omission.
 */
export function createPlatformSettingsRouter(deps: PlatformSettingsRouterDeps): Router {
  const { getPlatformSettingsUseCase, updatePlatformSettingsUseCase, tokenService } = deps;

  const router = Router();
  router.use(authenticate(tokenService), authorize([UserRole.SUPER_ADMIN]));

  router.get('/', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const settings = await getPlatformSettingsUseCase.execute({ callerRole: req.user!.role });
      res.json(settings.toJSON());
    } catch (error) {
      if (error instanceof UnauthorizedError) {
        return res.status(403).json({ error: error.message });
      }
      next(error);
    }
  });

  router.put(
    '/',
    validateRequest(updatePlatformSettingsSchema),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const settings = await updatePlatformSettingsUseCase.execute({
          callerRole: req.user!.role,
          patch: req.body,
        });
        res.json(settings.toJSON());
      } catch (error) {
        if (error instanceof UnauthorizedError) {
          return res.status(403).json({ error: error.message });
        }
        if (error instanceof InvalidPlatformSettingsError) {
          return res.status(400).json({ error: error.message });
        }
        next(error);
      }
    }
  );

  return router;
}
