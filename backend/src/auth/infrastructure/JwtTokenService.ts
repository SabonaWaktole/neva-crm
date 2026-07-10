import { ITokenService, TokenPayload } from '@auth/application/ports/ITokenService';
import * as jwt from 'jsonwebtoken';

export class JwtTokenService implements ITokenService {
  private readonly secret: string;
  private readonly expiresIn: string;

  constructor() {
    this.secret = process.env.JWT_SECRET || 'secret';
    this.expiresIn = process.env.JWT_EXPIRATION || '24h';
  }

  sign(payload: TokenPayload): string {
    return jwt.sign(payload, this.secret, { expiresIn: this.expiresIn as any });
  }

  verify(token: string): TokenPayload {
    return jwt.verify(token, this.secret) as TokenPayload;
  }
}
