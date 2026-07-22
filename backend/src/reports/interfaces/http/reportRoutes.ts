import { Router } from 'express';
import { authenticate } from '../../../main/interfaces/http/middlewares/authenticate';
import { resolveTenant } from '../../../main/interfaces/http/middlewares/resolveTenant';
import { authorize } from '../../../main/interfaces/http/middlewares/authorize';
import { ReportsController } from './ReportsController';

export const createReportRouter = (
  reportsController: ReportsController,
  tokenService: any, 
  tenantRepository: any
) => {
  const router = Router({ mergeParams: true });

  // Require authentication and resolve the tenant from the URL
  router.use(authenticate(tokenService));
  router.use(resolveTenant(tenantRepository));

  // Only business owners and super admins can view reports
  router.use(authorize(['BUSINESS_OWNER', 'SUPER_ADMIN']));

  router.get('/revenue', reportsController.getRevenue);
  router.get('/clients', reportsController.getClients);
  router.get('/inventory', reportsController.getInventory);

  return router;
};
