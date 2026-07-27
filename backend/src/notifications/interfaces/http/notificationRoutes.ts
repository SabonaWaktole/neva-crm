import { Router } from 'express';
import { NotificationController } from './NotificationController';
import { ITokenService } from '../../../auth/application/ports/ITokenService';
import { ITenantRepository } from '../../../tenant/domain/repositories/ITenantRepository';
import { authenticate } from '../../../main/interfaces/http/middlewares/authenticate';
import { resolveTenant } from '../../../main/interfaces/http/middlewares/resolveTenant';

/**
 * There is no `authorize(...)` on any of these.
 *
 * That is deliberate, not an omission: every role has notifications, and the
 * authorisation that matters is per-row, not per-role. Each handler reads the
 * recipient from the token and each repository call filters by
 * `tenantId + recipientUserId`, so a caller can only ever reach their own
 * rows. A role gate here would add nothing and would wrongly imply that some
 * roles may read others' notifications.
 */
export const createNotificationRouter = (
  controller: NotificationController,
  tokenService: ITokenService,
  tenantRepository: ITenantRepository
): Router => {
  const router = Router({ mergeParams: true });

  const authMw = authenticate(tokenService);
  const resolveTenantMw = resolveTenant(tenantRepository);

  router.use(authMw, resolveTenantMw);

  router.get('/', controller.list);
  router.patch('/read-all', controller.markEverythingRead);
  // After /read-all, so the literal path is not swallowed by :id.
  router.patch('/:id/read', controller.markOneRead);

  return router;
};
