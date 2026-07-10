import { authenticate } from '@main/interfaces/http/middlewares/authenticate';
import { ITokenService } from '@auth/application/ports/ITokenService';
import { Request, Response, NextFunction } from 'express';

describe('authenticate middleware', () => {
  let mockTokenService: jest.Mocked<ITokenService>;
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: NextFunction;

  beforeEach(() => {
    mockTokenService = {
      sign: jest.fn(),
      verify: jest.fn(),
    };
    req = { header: jest.fn() };
    res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    next = jest.fn();
  });

  it('should authenticate a valid token', () => {
    (req.header as jest.Mock).mockReturnValue('Bearer valid-token');
    mockTokenService.verify.mockReturnValue({ userId: 'u1', role: 'STAFF', tenantId: 't1' } as any);

    const middleware = authenticate(mockTokenService);
    middleware(req as Request, res as Response, next);

    expect(req.user).toBeDefined();
    expect(req.user?.userId).toBe('u1');
    expect(next).toHaveBeenCalled();
  });

  it('should return 401 if no token is provided', () => {
    (req.header as jest.Mock).mockReturnValue(undefined);

    const middleware = authenticate(mockTokenService);
    middleware(req as Request, res as Response, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Access denied. No token provided.' });
    expect(next).not.toHaveBeenCalled();
  });

  it('should return 401 if token is invalid', () => {
    (req.header as jest.Mock).mockReturnValue('Bearer invalid-token');
    mockTokenService.verify.mockImplementation(() => { throw new Error('Invalid'); });

    const middleware = authenticate(mockTokenService);
    middleware(req as Request, res as Response, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Invalid token.' });
    expect(next).not.toHaveBeenCalled();
  });
});
