import { Router } from 'express';
import { ITokenService } from '../../../auth/application/ports/ITokenService';
import { ITenantRepository } from '../../../tenant/domain/repositories/ITenantRepository';
import { QuotationsController } from './QuotationsController';
import { authenticate } from '../../../main/interfaces/http/middlewares/authenticate';
import { resolveTenant } from '../../../main/interfaces/http/middlewares/resolveTenant';

export const createQuotationRouter = (
  quotationController: QuotationsController,
  tokenService: ITokenService,
  tenantRepository: ITenantRepository
) => {
  const router = Router({ mergeParams: true });

  // Apply authentication and tenant resolution to all quotation routes
  router.use(authenticate(tokenService));
  router.use(resolveTenant(tenantRepository));

  router.use('/', quotationController.router);

  return router;
};
