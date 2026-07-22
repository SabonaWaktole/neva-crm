import { NextFunction, Request, Response } from 'express';
import { ITokenService } from '../../../../auth/application/ports/ITokenService';

export const optionalAuthenticate = (tokenService: ITokenService) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    let token = req.cookies?.jwt;

    if (!token) {
      token = req.header('Authorization')?.replace('Bearer ', '');
    }

    if (token) {
      try {
        req.user = tokenService.verify(token);
      } catch {
        // Ignore invalid/expired tokens for optional auth
      }
    }

    next();
  };
};
