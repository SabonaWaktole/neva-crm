import { NextFunction, Request, Response } from 'express';
import { ITokenService } from '../../../../auth/application/ports/ITokenService';

declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        role: string;
        tenantId: string | null;
        tenantSlug: string | null;
        warehouseId: string | null;
        /**
         * Present only while a SUPER_ADMIN is managing a workspace they entered
         * from the platform console. See TokenPayload for the full contract.
         */
        impersonatorId?: string;
        impersonatorEmail?: string;
      };
    }
  }
}

export const authenticate = (tokenService: ITokenService) => {
  return (req: Request, res: Response, next: NextFunction) => {
    let token = req.cookies?.jwt;

    if (!token) {
      token = req.header('Authorization')?.replace('Bearer ', '');
    }

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
