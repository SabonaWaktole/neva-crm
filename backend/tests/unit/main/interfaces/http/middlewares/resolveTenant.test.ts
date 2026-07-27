import { resolveTenant } from '@main/interfaces/http/middlewares/resolveTenant';
import { ITenantRepository } from '@tenant/domain/repositories/ITenantRepository';
import { Request, Response, NextFunction } from 'express';
import { UserRole } from '@auth/domain/enums/UserRole';
import { Tenant } from '@tenant/domain/entities/Tenant';
import { SubscriptionStatus } from '@tenant/domain/enums/SubscriptionStatus';

/**
 * A real Tenant entity, not an object literal cast to one.
 *
 * The literals these tests used to pass had no `isSuspended`, so they broke the
 * moment the middleware asked the entity a question rather than reading a field
 * off it. A double that cannot answer what production answers is not standing
 * in for the thing it claims to.
 */
const tenantEntity = (
  overrides: { id?: string; urlSlug?: string; subscriptionStatus?: SubscriptionStatus } = {}
) =>
  Tenant.create({
    id: overrides.id ?? 't1',
    name: 'Acme',
    urlSlug: overrides.urlSlug ?? 'acme',
    subscriptionStatus: overrides.subscriptionStatus ?? SubscriptionStatus.ACTIVE,
    createdAt: new Date(),
  });

describe('resolveTenant middleware', () => {
  let mockTenantRepository: jest.Mocked<ITenantRepository>;
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: NextFunction;

  beforeEach(() => {
    mockTenantRepository = {
      findById: jest.fn(),
      findBySlug: jest.fn(),
      create: jest.fn(),
      findAll: jest.fn(),
      updateSettings: jest.fn(),
      setSubscriptionStatus: jest.fn(),
    } as any;
    req = { params: {}, user: undefined };
    res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    next = jest.fn();
  });

  it('should resolve tenant and attach to request', async () => {
    req.params = { tenantSlug: 'acme' };
    req.user = { userId: 'u1', role: UserRole.STAFF, tenantId: 't1', tenantSlug: 'tenant-1', warehouseId: null };
    mockTenantRepository.findBySlug.mockResolvedValue(tenantEntity());

    const middleware = resolveTenant(mockTenantRepository);
    await middleware(req as Request, res as Response, next);

    expect(req.tenant).toBeDefined();
    expect(req.tenant?.id).toBe('t1');
    expect(next).toHaveBeenCalled();
  });

  it('should return 404 if tenant not found', async () => {
    req.params = { tenantSlug: 'non-existent' };
    mockTenantRepository.findBySlug.mockResolvedValue(null);

    const middleware = resolveTenant(mockTenantRepository);
    await middleware(req as Request, res as Response, next);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(next).not.toHaveBeenCalled();
  });

  it('should return 403 if user belongs to a different tenant', async () => {
    req.params = { tenantSlug: 'acme' };
    req.user = { userId: 'u1', role: UserRole.STAFF, tenantId: 'different-t', tenantSlug: 'different-t', warehouseId: null }; // User is logged in to a different tenant
    mockTenantRepository.findBySlug.mockResolvedValue(tenantEntity());

    const middleware = resolveTenant(mockTenantRepository);
    await middleware(req as Request, res as Response, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ error: 'Cross-tenant access forbidden' });
    expect(next).not.toHaveBeenCalled();
  });

  // SUPER_ADMIN is a platform-level role that administers tenants themselves,
  // never an individual business's operational data. It previously bypassed the
  // tenant check here, which let it reach controllers that then dereferenced its
  // null tenantId and returned 500s. It is now treated like any other user whose
  // tenantId does not match the URL.
  it('should return 403 for SUPER_ADMIN on a tenant-scoped route (no role exemption)', async () => {
    req.params = { tenantSlug: 'acme' };
    req.user = { userId: 'sa', role: UserRole.SUPER_ADMIN, tenantId: null, tenantSlug: null, warehouseId: null };
    mockTenantRepository.findBySlug.mockResolvedValue(tenantEntity());

    const middleware = resolveTenant(mockTenantRepository);
    await middleware(req as Request, res as Response, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ error: 'Cross-tenant access forbidden' });
    expect(next).not.toHaveBeenCalled();
    expect(req.tenant).toBeUndefined();
  });

  it('still allows a user whose tenantId matches the resolved tenant', async () => {
    req.params = { tenantSlug: 'acme' };
    req.user = { userId: 'u1', role: UserRole.BUSINESS_OWNER, tenantId: 't1', tenantSlug: 'acme', warehouseId: null };
    mockTenantRepository.findBySlug.mockResolvedValue(tenantEntity());

    const middleware = resolveTenant(mockTenantRepository);
    await middleware(req as Request, res as Response, next);

    expect(req.tenant?.id).toBe('t1');
    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  describe('suspended workspaces', () => {
    const suspended = () => tenantEntity({ subscriptionStatus: SubscriptionStatus.SUSPENDED });

    it('returns 403 with a TENANT_SUSPENDED code for a member of a suspended tenant', async () => {
      req.params = { tenantSlug: 'acme' };
      req.user = { userId: 'u1', role: UserRole.BUSINESS_OWNER, tenantId: 't1', tenantSlug: 'acme', warehouseId: null };
      mockTenantRepository.findBySlug.mockResolvedValue(suspended());

      await resolveTenant(mockTenantRepository)(req as Request, res as Response, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        error: 'This workspace is suspended — contact support',
        code: 'TENANT_SUSPENDED',
      });
      expect(next).not.toHaveBeenCalled();
      expect(req.tenant).toBeUndefined();
    });

    it('checks suspension before membership, so it applies to every caller uniformly', async () => {
      req.params = { tenantSlug: 'acme' };
      // A user from a DIFFERENT tenant. Either rejection would be correct, but
      // the order is pinned so the response stays predictable.
      req.user = { userId: 'u1', role: UserRole.STAFF, tenantId: 'other', tenantSlug: 'other', warehouseId: null };
      mockTenantRepository.findBySlug.mockResolvedValue(suspended());

      await resolveTenant(mockTenantRepository)(req as Request, res as Response, next);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ code: 'TENANT_SUSPENDED' })
      );
    });

    it('lets the request through when allowSuspended is set', async () => {
      /*
       * The tenant login route, and only it. LoginUseCase performs the
       * suspension check after verifying the password, so the endpoint cannot
       * be used to enumerate which workspaces are suspended.
       */
      req.params = { tenantSlug: 'acme' };
      req.user = { userId: 'u1', role: UserRole.BUSINESS_OWNER, tenantId: 't1', tenantSlug: 'acme', warehouseId: null };
      mockTenantRepository.findBySlug.mockResolvedValue(suspended());

      await resolveTenant(mockTenantRepository, { allowSuspended: true })(
        req as Request,
        res as Response,
        next
      );

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
      expect(req.tenant?.id).toBe('t1');
    });

    it('allowSuspended does NOT waive the cross-tenant check', async () => {
      // The exemption is about subscription status only. It must not become an
      // accidental hole in tenant isolation.
      req.params = { tenantSlug: 'acme' };
      req.user = { userId: 'u1', role: UserRole.STAFF, tenantId: 'different-t', tenantSlug: 'different-t', warehouseId: null };
      mockTenantRepository.findBySlug.mockResolvedValue(suspended());

      await resolveTenant(mockTenantRepository, { allowSuspended: true })(
        req as Request,
        res as Response,
        next
      );

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ error: 'Cross-tenant access forbidden' });
      expect(next).not.toHaveBeenCalled();
    });
  });
});
