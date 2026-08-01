import { UserRole } from '../../domain/enums/UserRole';

export interface TokenPayload {
  userId: string;
  role: UserRole;
  tenantId: string | null;
  tenantSlug: string | null;
  warehouseId: string | null;
  /**
   * Set only on a token minted by POST /api/tenants/:id/enter, where a
   * SUPER_ADMIN has stepped into a workspace to administer it.
   *
   * Such a token carries `role: BUSINESS_OWNER` and the target workspace's
   * tenantId/tenantSlug, so every existing tenant-scoped route, role check and
   * repository call works unchanged — in particular `resolveTenant`'s
   * cross-tenant rule, which compares the URL slug against this claim and is
   * therefore still enforced against the ONE workspace that was entered.
   *
   * `userId` stays the platform administrator's own id, so anything they write
   * inside the workspace is attributed to them rather than to a client's staff.
   *
   * These fields exist to render the "you are managing X" banner and to let
   * POST /api/auth/exit-workspace mint a plain platform token again. Absent on
   * every ordinary login, so nothing else has to know about them.
   */
  impersonatorId?: string;
  impersonatorEmail?: string;
}

export interface ITokenService {
  sign(payload: TokenPayload): string;
  verify(token: string): TokenPayload;
}
