import { Router, Request, Response, NextFunction } from 'express';
import { GetTenantsUseCase } from '../../../application/use-cases/GetTenantsUseCase';
import { CreateTenantWithOwnerUseCase } from '../../../application/use-cases/CreateTenantWithOwnerUseCase';
import { SetTenantSubscriptionStatusUseCase } from '../../../application/use-cases/SetTenantSubscriptionStatusUseCase';
import { EnterTenantUseCase } from '../../../application/use-cases/EnterTenantUseCase';
import { Tenant } from '../../../domain/entities/Tenant';
import { TenantNotFoundError, TenantSuspendedError } from '../../../domain/errors';
import { CreateUserUseCase } from '../../../../auth/application/use-cases/CreateUserUseCase';
import { GetPlatformUsersUseCase } from '../../../../auth/application/use-cases/GetPlatformUsersUseCase';
import { BulkUpdateTenantSettingsUseCase } from '../../../../settings/application/use-cases/BulkUpdateTenantSettingsUseCase';
import { bulkUpdateTenantSettingsSchema } from '../../../../settings/interfaces/http/schemas/platformSettingsSchemas';
import {
  authCookieOptions,
  AUTH_COOKIE_MAX_AGE_MS,
} from '../../../../main/interfaces/http/authCookie';
import { SlugAlreadyTakenError, UnauthorizedError } from '../../../../auth/domain/errors';
import { authenticate } from '../../../../main/interfaces/http/middlewares/authenticate';
import { authorize } from '../../../../main/interfaces/http/middlewares/authorize';
import { validateRequest } from '../../../../main/interfaces/http/middlewares/validateRequest';
import { tenantSchemas } from '../schemas/tenantSchemas';
import { UserRole } from '../../../../auth/domain/enums/UserRole';
import { ITokenService } from '../../../../auth/application/ports/ITokenService';

/**
 * The shape every tenant endpoint returns.
 *
 * One projection function rather than a hand-written object literal per route,
 * for the same reason `PrismaTenantRepository.toDomain` exists: three routes
 * each spelling out their own field list is how one of them ends up quietly
 * omitting `subscriptionStatus` and the console renders a suspended tenant as
 * active.
 */
const toResponse = (t: Tenant) => ({
  id: t.id,
  name: t.name,
  urlSlug: t.urlSlug,
  subscriptionStatus: t.subscriptionStatus,
  createdAt: t.createdAt,
});

export interface TenantRouterDeps {
  getTenantsUseCase: GetTenantsUseCase;
  createTenantWithOwnerUseCase: CreateTenantWithOwnerUseCase;
  suspendTenantUseCase: SetTenantSubscriptionStatusUseCase;
  reactivateTenantUseCase: SetTenantSubscriptionStatusUseCase;
  enterTenantUseCase: EnterTenantUseCase;
  createUserUseCase: CreateUserUseCase;
  getPlatformUsersUseCase: GetPlatformUsersUseCase;
  bulkUpdateTenantSettingsUseCase: BulkUpdateTenantSettingsUseCase;
  tokenService: ITokenService;
}

export function createTenantRouter(deps: TenantRouterDeps): Router {
  const {
    getTenantsUseCase,
    createTenantWithOwnerUseCase,
    suspendTenantUseCase,
    reactivateTenantUseCase,
    enterTenantUseCase,
    createUserUseCase,
    getPlatformUsersUseCase,
    bulkUpdateTenantSettingsUseCase,
    tokenService,
  } = deps;

  const router = Router();

  /*
   * Every route here is platform-level: SUPER_ADMIN administering the tenants
   * themselves, never a business's own data. That is why this router is mounted
   * at /api/tenants with no :tenantSlug prefix, and therefore why `resolveTenant`
   * never runs on it — there is no tenant context to resolve and no cross-tenant
   * surface to guard. `authenticate` + `authorize([SUPER_ADMIN])` is the whole
   * access control, applied uniformly at the router level so a route added later
   * cannot be left unguarded by omission.
   */
  router.use(authenticate(tokenService), authorize([UserRole.SUPER_ADMIN]));

  /**
   * Every handler needs the caller's role, and each one checked `req.user`
   * itself before. Both middlewares above guarantee it, so this is unreachable
   * in practice — but it is checked rather than asserted away, so a future
   * remount without `authenticate` fails closed with a 401 instead of passing
   * `undefined` in as the caller's role.
   */
  const callerRoleOf = (req: Request): string | null => req.user?.role ?? null;

  // SUPER_ADMIN only: list all tenants, suspended ones included.
  router.get('/', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const callerRole = callerRoleOf(req);
      if (!callerRole) {
        return res.status(401).json({ error: 'Access denied. No token provided.' });
      }
      const skip = req.query.skip ? parseInt(req.query.skip as string, 10) : undefined;
      const take = req.query.take ? parseInt(req.query.take as string, 10) : undefined;

      const result = await getTenantsUseCase.execute({ callerRole, skip, take });

      res.json({
        items: result.items.map(toResponse),
        total: result.total,
      });
    } catch (error) {
      next(error);
    }
  });

  /**
   * SUPER_ADMIN only: provision a workspace and its first Business Owner.
   *
   * This runs the same `CreateTenantWithOwnerUseCase` as public
   * self-registration — two parallel paths onto one implementation, not a
   * replacement for the public flow.
   */
  router.post(
    '/',
    validateRequest(tenantSchemas.createTenant),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        if (!callerRoleOf(req)) {
          return res.status(401).json({ error: 'Access denied. No token provided.' });
        }

        // req.body is the *parsed* value: validateRequest replaces it with the
        // schema output, so undeclared keys cannot reach the use case. TD-011.
        const { tenant, user } = await createTenantWithOwnerUseCase.execute({
          companyName: req.body.companyName,
          urlSlug: req.body.urlSlug,
          ownerEmail: req.body.ownerEmail,
          ownerPassword: req.body.ownerPassword,
        });

        res.status(201).json({
          tenant: toResponse(tenant),
          // The owner's password is never echoed back, not even the hash.
          owner: { id: user.id, email: user.email, role: user.role },
        });
      } catch (error) {
        if (error instanceof SlugAlreadyTakenError) {
          return res.status(409).json({ error: error.message });
        }
        next(error);
      }
    }
  );

  /*
   * Suspend and reactivate are PATCH on a sub-path rather than a single
   * PATCH /:id taking a status in the body. The two are distinct administrative
   * acts with different consequences, and a body-driven version makes
   * "reactivate everything" a one-character typo away from "suspend
   * everything".
   *
   * Both are idempotent: re-suspending a suspended tenant returns 200 with the
   * unchanged tenant, not an error. See SetTenantSubscriptionStatusUseCase.
   */
  const statusHandler =
    (useCase: SetTenantSubscriptionStatusUseCase) =>
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const callerRole = callerRoleOf(req);
        if (!callerRole) {
          return res.status(401).json({ error: 'Access denied. No token provided.' });
        }

        const tenant = await useCase.execute({
          callerRole,
          tenantId: String(req.params.id),
        });
        res.json({ tenant: toResponse(tenant) });
      } catch (error) {
        if (error instanceof TenantNotFoundError) {
          return res.status(404).json({ error: 'Tenant not found' });
        }
        if (error instanceof UnauthorizedError) {
          return res.status(403).json({ error: error.message });
        }
        next(error);
      }
    };

  router.patch('/:id/suspend', statusHandler(suspendTenantUseCase));
  router.patch('/:id/reactivate', statusHandler(reactivateTenantUseCase));

  /**
   * SUPER_ADMIN only: every account on the platform, across all workspaces.
   *
   * Registered BEFORE the `/:id/...` routes below. Express matches in
   * declaration order, so with the opposite order a GET of this path would be
   * fine but the router would grow increasingly fragile as `/:id` siblings are
   * added — declaring the literal first removes the question.
   */
  router.get('/users', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const callerRole = callerRoleOf(req);
      if (!callerRole) {
        return res.status(401).json({ error: 'Access denied. No token provided.' });
      }

      const result = await getPlatformUsersUseCase.execute({
        callerRole,
        tenantId: req.query.tenantId ? String(req.query.tenantId) : undefined,
        role: req.query.role ? String(req.query.role) : undefined,
        // Three states, not two: absent means "any", and only the literal
        // strings flip the filter. `Boolean(req.query.isActive)` would have made
        // "false" truthy and silently hidden every deactivated account.
        isActive:
          req.query.isActive === undefined
            ? undefined
            : String(req.query.isActive) === 'true',
        q: req.query.q ? String(req.query.q) : undefined,
        skip: req.query.skip ? parseInt(String(req.query.skip), 10) : undefined,
        take: req.query.take ? parseInt(String(req.query.take), 10) : undefined,
      });

      res.json(result);
    } catch (error) {
      if (error instanceof UnauthorizedError) {
        return res.status(403).json({ error: error.message });
      }
      next(error);
    }
  });

  /**
   * SUPER_ADMIN only: apply the same settings to several workspaces at once.
   *
   * Registered before `/:id/...` for the same reason `/users` above is: a
   * static segment declared after a `/:id` sibling is a latent bug waiting for
   * that sibling to be added.
   *
   * Writes directly onto each selected tenant's OWN settings — indistinguishable
   * from that workspace's Business Owner making the same change, just done to
   * several at once. This is NOT the platform-wide default below: it never
   * touches a tenant that was not explicitly selected, and it has no future
   * effect on a tenant created afterward.
   */
  router.put(
    '/bulk-settings',
    validateRequest(bulkUpdateTenantSettingsSchema),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const callerRole = callerRoleOf(req);
        if (!callerRole) {
          return res.status(401).json({ error: 'Access denied. No token provided.' });
        }

        const result = await bulkUpdateTenantSettingsUseCase.execute({
          callerRole,
          tenantIds: req.body.tenantIds,
          settings: req.body.settings,
        });

        res.json(result);
      } catch (error) {
        if (error instanceof UnauthorizedError) {
          return res.status(403).json({ error: error.message });
        }
        next(error);
      }
    }
  );

  /**
   * SUPER_ADMIN only: create a user directly inside a workspace, credentials
   * included, without entering that workspace first.
   *
   * The in-workspace equivalent is POST /api/:tenantSlug/auth/users, which a
   * BUSINESS_OWNER uses for their own staff. Both run `CreateUserUseCase`, which
   * is where the "who may create which role, where" rules actually live.
   */
  router.post(
    '/:id/users',
    validateRequest(tenantSchemas.createUser),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const callerRole = callerRoleOf(req);
        if (!callerRole) {
          return res.status(401).json({ error: 'Access denied. No token provided.' });
        }

        const user = await createUserUseCase.execute({
          callerRole,
          callerTenantId: req.user!.tenantId,
          tenantId: String(req.params.id),
          email: req.body.email,
          password: req.body.password,
          firstName: req.body.firstName,
          lastName: req.body.lastName,
          phone: req.body.phone,
          role: req.body.role,
          warehouseId: req.body.warehouseId,
        });

        res.status(201).json({ user });
      } catch (error) {
        if (error instanceof UnauthorizedError) {
          return res.status(403).json({ error: error.message });
        }
        next(error);
      }
    }
  );

  /**
   * SUPER_ADMIN only: enter a workspace and administer it as its owner.
   *
   * Replaces the browser's platform session with a workspace-scoped one — see
   * EnterTenantUseCase for why this is a session swap rather than an exemption
   * inside `resolveTenant`. The cookie is set through the shared
   * `authCookieOptions()` so it matches login's exactly; a hand-rolled option
   * set here would work locally and silently fail cross-site in production.
   */
  router.post('/:id/enter', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const callerRole = callerRoleOf(req);
      if (!callerRole) {
        return res.status(401).json({ error: 'Access denied. No token provided.' });
      }

      const result = await enterTenantUseCase.execute({
        callerUserId: req.user!.userId,
        callerRole,
        tenantId: String(req.params.id),
      });

      res.cookie('jwt', result.token, {
        ...authCookieOptions(),
        maxAge: AUTH_COOKIE_MAX_AGE_MS,
      });
      res.json({ tenantSlug: result.tenantSlug, tenantName: result.tenantName });
    } catch (error) {
      if (error instanceof TenantNotFoundError) {
        return res.status(404).json({ error: 'Tenant not found' });
      }
      if (error instanceof TenantSuspendedError) {
        return res.status(403).json({ error: error.message, code: 'TENANT_SUSPENDED' });
      }
      if (error instanceof UnauthorizedError) {
        return res.status(403).json({ error: error.message });
      }
      next(error);
    }
  });

  return router;
}
