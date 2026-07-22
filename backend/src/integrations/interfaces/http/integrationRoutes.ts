import { Router } from 'express';
import { IntegrationsController } from './IntegrationsController';
import { ITokenService } from '../../../auth/application/ports/ITokenService';
import { ITenantRepository } from '../../../tenant/domain/repositories/ITenantRepository';
import { resolveTenant } from '../../../main/interfaces/http/middlewares/resolveTenant';
import { authorize } from '../../../main/interfaces/http/middlewares/authorize';
import { authenticate } from '../../../main/interfaces/http/middlewares/authenticate';

import { UserRole } from '../../../auth/domain/enums/UserRole';

export const createIntegrationRouter = (
  controller: IntegrationsController,
  tokenService: ITokenService,
  tenantRepository: ITenantRepository
): Router => {
  const router = Router({ mergeParams: true });

  // Apply authentication, tenant resolution and basic authorization to all routes
  router.use(authenticate(tokenService));
  router.use(resolveTenant(tenantRepository));
  router.use(authorize([UserRole.BUSINESS_OWNER, UserRole.STAFF, UserRole.SUPER_ADMIN]));

  router.get('/', controller.getIntegrations);
  router.post('/connect', controller.connectIntegration);
  router.post('/disconnect', controller.disconnectIntegration);

  return router;
};
