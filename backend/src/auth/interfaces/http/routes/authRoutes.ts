import { Router } from 'express';
import { AuthController } from '@auth/interfaces/http/controllers/AuthController';
import { validateRequest } from '@main/interfaces/http/middlewares/validateRequest';
import { authSchemas } from '@auth/interfaces/http/schemas/authSchemas';
import { authenticate } from '@main/interfaces/http/middlewares/authenticate';
import { authorize } from '@main/interfaces/http/middlewares/authorize';
import { resolveTenant } from '@main/interfaces/http/middlewares/resolveTenant';
import { UserRole } from '@auth/domain/enums/UserRole';
import { ITokenService } from '@auth/application/ports/ITokenService';
import { ITenantRepository } from '@tenant/domain/repositories/ITenantRepository';

export const createAuthRoutes = (
  authController: AuthController,
  tokenService: ITokenService,
  tenantRepository: ITenantRepository
): Router => {
  const router = Router();
  const authMw = authenticate(tokenService);
  const resolveTenantMw = resolveTenant(tenantRepository);

  router.post('/register', validateRequest(authSchemas.register), authController.register);
  router.post('/login', validateRequest(authSchemas.login), authController.login);
  router.post('/logout', authController.logout);
  router.get('/me', authMw, authController.getMe);
  
  router.post('/invitations/accept', validateRequest(authSchemas.acceptInvitation), authController.acceptInvitation);
  
  router.post('/password-reset/request', validateRequest(authSchemas.requestPasswordReset), authController.requestPasswordReset);
  router.post('/password-reset/reset', validateRequest(authSchemas.resetPassword), authController.resetPassword);

  router.post(
    '/:tenantSlug/invitations',
    authMw,
    resolveTenantMw,
    authorize([UserRole.BUSINESS_OWNER, UserRole.SUPER_ADMIN]),
    validateRequest(authSchemas.inviteStaff),
    authController.inviteStaff
  );

  return router;
};
