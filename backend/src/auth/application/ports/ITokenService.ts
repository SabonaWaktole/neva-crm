import { UserRole } from '../../domain/enums/UserRole';

export interface TokenPayload {
  userId: string;
  role: UserRole;
  tenantId: string | null;
  tenantSlug: string | null;
  warehouseId: string | null;
}

export interface ITokenService {
  sign(payload: TokenPayload): string;
  verify(token: string): TokenPayload;
}
