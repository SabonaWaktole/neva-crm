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

export const createGlobalAuthRoutes = (
  authController: AuthController,
  tokenService: ITokenService,
): Router => {
  const router = Router();
  const authMw = authenticate(tokenService);

  router.post('/register', validateRequest(authSchemas.register), authController.register);
  router.post('/login', validateRequest(authSchemas.login), authController.loginGlobal);
  router.post('/logout', authController.logout);
  router.get('/me', authMw, authController.getMe);
  
  router.post('/invitations/accept', validateRequest(authSchemas.acceptInvitation), authController.acceptInvitation);
  router.post('/password-reset/reset', validateRequest(authSchemas.resetPassword), authController.resetPassword);

  return router;
};

export const createTenantAuthRoutes = (
  authController: AuthController,
  tokenService: ITokenService,
  tenantRepository: ITenantRepository
): Router => {
  const router = Router({ mergeParams: true });
  const authMw = authenticate(tokenService);
  const resolveTenantMw = resolveTenant(tenantRepository);

  router.post('/login', resolveTenantMw, validateRequest(authSchemas.login), authController.loginTenant);
  router.post('/password-reset/request', resolveTenantMw, validateRequest(authSchemas.requestPasswordReset), authController.requestPasswordReset);

  router.post(
    '/invitations',
    authMw,
    resolveTenantMw,
    authorize([UserRole.BUSINESS_OWNER, UserRole.SUPER_ADMIN]),
    validateRequest(authSchemas.inviteStaff),
    authController.inviteStaff
  );

  router.get(
    '/invitations',
    authMw,
    resolveTenantMw,
    authorize([UserRole.BUSINESS_OWNER, UserRole.SUPER_ADMIN]),
    authController.getPendingInvitations
  );

  router.get(
    '/staff',
    authMw,
    resolveTenantMw,
    authorize([UserRole.BUSINESS_OWNER, UserRole.STAFF]),
    authController.getTenantStaff
  );

  return router;
};
