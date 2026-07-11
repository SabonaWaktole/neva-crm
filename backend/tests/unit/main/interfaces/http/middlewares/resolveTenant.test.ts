import { resolveTenant } from '@main/interfaces/http/middlewares/resolveTenant';
import { ITenantRepository } from '@tenant/domain/repositories/ITenantRepository';
import { Request, Response, NextFunction } from 'express';
import { UserRole } from '@auth/domain/enums/UserRole';

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
    };
    req = { params: {}, user: undefined };
    res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    next = jest.fn();
  });

  it('should resolve tenant and attach to request', async () => {
    req.params = { tenantSlug: 'acme' };
    req.user = { userId: 'u1', role: UserRole.STAFF, tenantId: 't1', tenantSlug: 'tenant-1' };
    mockTenantRepository.findBySlug.mockResolvedValue({ id: 't1', urlSlug: 'acme' } as any);

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
    req.user = { userId: 'u1', role: UserRole.STAFF, tenantId: 'different-t', tenantSlug: 'different-t' }; // User is logged in to a different tenant
    mockTenantRepository.findBySlug.mockResolvedValue({ id: 't1', urlSlug: 'acme' } as any);

    const middleware = resolveTenant(mockTenantRepository);
    await middleware(req as Request, res as Response, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ error: 'Cross-tenant access forbidden' });
    expect(next).not.toHaveBeenCalled();
  });

  it('should allow SUPER_ADMIN to access any tenant', async () => {
    req.params = { tenantSlug: 'acme' };
    req.user = { userId: 'sa', role: UserRole.SUPER_ADMIN, tenantId: null, tenantSlug: null };
    mockTenantRepository.findBySlug.mockResolvedValue({ id: 't1', urlSlug: 'acme' } as any);

    const middleware = resolveTenant(mockTenantRepository);
    await middleware(req as Request, res as Response, next);

    expect(req.tenant).toBeDefined();
    expect(next).toHaveBeenCalled();
  });
});
