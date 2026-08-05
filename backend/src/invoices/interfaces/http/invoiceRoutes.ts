import { Router } from 'express';
import { ITokenService } from '../../../auth/application/ports/ITokenService';
import { ITenantRepository } from '../../../tenant/domain/repositories/ITenantRepository';
import { InvoicesController } from './InvoicesController';
import { authenticate } from '../../../main/interfaces/http/middlewares/authenticate';
import { resolveTenant } from '../../../main/interfaces/http/middlewares/resolveTenant';

export const createInvoiceRouter = (
  invoiceController: InvoicesController,
  tokenService: ITokenService,
  tenantRepository: ITenantRepository
) => {
  const router = Router({ mergeParams: true });

  router.use(authenticate(tokenService));
  router.use(resolveTenant(tenantRepository));

  router.use('/', invoiceController.router);

  return router;
};
