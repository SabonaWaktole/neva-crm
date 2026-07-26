import { Router } from 'express';
import { ITokenService } from '../../../auth/application/ports/ITokenService';
import { ITenantRepository } from '../../../tenant/domain/repositories/ITenantRepository';
import { MediaController } from './MediaController';
import { authenticate } from '../../../main/interfaces/http/middlewares/authenticate';
import { resolveTenant } from '../../../main/interfaces/http/middlewares/resolveTenant';

export const createMediaRouter = (
  mediaController: MediaController,
  tokenService: ITokenService,
  tenantRepository: ITenantRepository
) => {
  const router = Router({ mergeParams: true });

  // Same guard chain as every other tenant-scoped router: authenticate first,
  // then confirm the caller actually belongs to the tenant in the URL.
  router.use(authenticate(tokenService));
  router.use(resolveTenant(tenantRepository));

  router.use('/', mediaController.router);

  return router;
};
