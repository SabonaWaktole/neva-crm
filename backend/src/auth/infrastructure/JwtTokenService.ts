import { ITokenService, TokenPayload } from '@auth/application/ports/ITokenService';
import { requireJwtSecret } from '@main/config/env';
import * as jwt from 'jsonwebtoken';

export class JwtTokenService implements ITokenService {
  private readonly secret: string;
  private readonly expiresIn: string;

  constructor() {
    // Throws if JWT_SECRET is missing or blank. Enforced here rather than only
    // at startup so no code path can construct a service that signs tokens with
    // a fallback secret.
    this.secret = requireJwtSecret();
    this.expiresIn = process.env.JWT_EXPIRATION || '24h';
  }

  sign(payload: TokenPayload): string {
    return jwt.sign(payload, this.secret, { expiresIn: this.expiresIn as any });
  }

  verify(token: string): TokenPayload {
    return jwt.verify(token, this.secret) as TokenPayload;
  }
}
