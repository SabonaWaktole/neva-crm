import { NextFunction, Request, Response } from 'express';
import { ITokenService } from '../../../../auth/application/ports/ITokenService';

declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        role: string;
        tenantId: string | null;
      };
    }
  }
}

export const authenticate = (tokenService: ITokenService) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ error: 'Access denied. No token provided.' });
    }

    try {
      const decoded = tokenService.verify(token);
      req.user = decoded;
      next();
    } catch (err) {
      return res.status(401).json({ error: 'Invalid token.' });
    }
  };
};
