import { UnauthorizedError } from '../../../auth/domain/errors';
import { UserRole } from '../../../auth/domain/enums/UserRole';

export interface GetGlobalMrrDTO {
  callerRole: string;
}

export interface GlobalMrr {
  amountCents: number;
  currency: string;
}

/**
 * Platform-wide Monthly Recurring Revenue for the Super Admin dashboard.
 *
 * No plan/price/subscription-amount field exists anywhere in the schema yet —
 * `Tenant.subscriptionStatus` only tracks ACTIVE/SUSPENDED, not what a tenant
 * pays. This returns 0 until billing data exists rather than a fabricated
 * figure; wire real math in here once pricing is modeled.
 */
export class GetGlobalMrrUseCase {
  async execute(dto: GetGlobalMrrDTO): Promise<GlobalMrr> {
    if (dto.callerRole !== UserRole.SUPER_ADMIN) {
      throw new UnauthorizedError('Only Super Admins can view global MRR');
    }

    return { amountCents: 0, currency: 'USD' };
  }
}
