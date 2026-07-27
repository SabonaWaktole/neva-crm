import { ITenantRepository } from '../../domain/repositories/ITenantRepository';
import { SubscriptionStatus } from '../../domain/enums/SubscriptionStatus';
import { UserRole } from '../../../auth/domain/enums/UserRole';
import { UnauthorizedError } from '../../../auth/domain/errors';
import { TenantNotFoundError } from '../../domain/errors';
import { Tenant } from '../../domain/entities/Tenant';

export interface SetTenantSubscriptionStatusDTO {
  callerRole: string;
  tenantId: string;
}

/**
 * Suspends or reactivates a workspace.
 *
 * One use case with the target status fixed at construction, rather than two
 * near-identical classes or one that takes the status as input. The two
 * endpoints are genuinely the same operation in opposite directions, and the
 * status arriving from the constructor rather than the request body means no
 * caller can ever pass a status the route did not intend.
 *
 * **Suspension is reversible and destroys nothing.** No rows are deleted, no
 * users are deactivated, no data is touched — the workspace simply stops being
 * able to authenticate (`LoginUseCase`) or serve requests (`resolveTenant`).
 * Hard deletion is deliberately not implemented here or anywhere else.
 */
export class SetTenantSubscriptionStatusUseCase {
  constructor(
    private readonly tenantRepo: ITenantRepository,
    private readonly targetStatus: SubscriptionStatus
  ) {}

  async execute(dto: SetTenantSubscriptionStatusDTO): Promise<Tenant> {
    /*
     * Redundant with `authorize([SUPER_ADMIN])` on the route, and kept for the
     * same reason GetTenantsUseCase keeps its copy: if this is ever mounted
     * without that middleware it fails closed rather than silently letting a
     * business owner suspend somebody else's workspace.
     */
    if (dto.callerRole !== UserRole.SUPER_ADMIN) {
      throw new UnauthorizedError('Only Super Admins can change a tenant subscription status');
    }

    const tenant = await this.tenantRepo.findById(dto.tenantId);
    if (!tenant) {
      throw new TenantNotFoundError(dto.tenantId);
    }

    /*
     * Idempotent by intent, not by accident. Suspending an already-suspended
     * tenant is a success, not a 409: the caller asked for a state, and the
     * state holds. That matters for a console where a double-click, a retry
     * after a timeout, or two admins acting at once must not produce an error
     * that suggests something went wrong. The write is skipped rather than
     * repeated because there is nothing to change.
     */
    if (tenant.subscriptionStatus === this.targetStatus) {
      return tenant;
    }

    await this.tenantRepo.setSubscriptionStatus(dto.tenantId, this.targetStatus);

    // Re-read rather than mutating the entity in memory, so the caller receives
    // what the database actually holds.
    const updated = await this.tenantRepo.findById(dto.tenantId);
    if (!updated) {
      throw new TenantNotFoundError(dto.tenantId);
    }
    return updated;
  }
}
