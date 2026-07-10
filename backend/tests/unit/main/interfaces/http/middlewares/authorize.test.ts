import { authorize } from '@main/interfaces/http/middlewares/authorize';
import { UserRole } from '@auth/domain/enums/UserRole';
import { Request, Response, NextFunction } from 'express';

describe('authorize middleware', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: NextFunction;

  beforeEach(() => {
    req = { user: undefined };
    res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    next = jest.fn();
  });

  it('should allow access if user has required role', () => {
    req.user = { userId: 'u1', role: UserRole.BUSINESS_OWNER, tenantId: 't1' };

    const middleware = authorize([UserRole.BUSINESS_OWNER, UserRole.SUPER_ADMIN]);
    middleware(req as Request, res as Response, next);

    expect(next).toHaveBeenCalled();
  });

  it('should return 403 if user lacks required role', () => {
    req.user = { userId: 'u1', role: UserRole.STAFF, tenantId: 't1' };

    const middleware = authorize([UserRole.BUSINESS_OWNER, UserRole.SUPER_ADMIN]);
    middleware(req as Request, res as Response, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ error: 'Forbidden. Insufficient permissions.' });
    expect(next).not.toHaveBeenCalled();
  });

  it('should return 401 if user is not authenticated (missing from req)', () => {
    const middleware = authorize([UserRole.STAFF]);
    middleware(req as Request, res as Response, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });
});
