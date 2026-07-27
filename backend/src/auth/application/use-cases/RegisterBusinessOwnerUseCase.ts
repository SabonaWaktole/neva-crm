import {
  CreateTenantWithOwnerUseCase,
  CreateTenantWithOwnerDTO,
} from '../../../tenant/application/use-cases/CreateTenantWithOwnerUseCase';

/**
 * Public self-registration: a business signs itself up.
 *
 * This is now a thin caller over {@link CreateTenantWithOwnerUseCase}, which
 * owns the actual provisioning. It used to own that logic itself, wrapped in
 * `IUnitOfWork` — a wrapper that opened a transaction and enrolled nothing in
 * it, so a failure between the tenant write and the user write left an orphan
 * workspace behind (TD-032). Sharing the implementation with the Super Admin
 * create path is what guarantees the two cannot drift apart, and in particular
 * that the admin path did not inherit that gap.
 *
 * The distinction between the two callers is entirely about pre-conditions —
 * this one is unauthenticated and rate-limited at the route — so this class
 * holds no logic of its own beyond delegating.
 */
export class RegisterBusinessOwnerUseCase {
  constructor(private readonly createTenantWithOwner: CreateTenantWithOwnerUseCase) {}

  async execute(input: CreateTenantWithOwnerDTO) {
    return this.createTenantWithOwner.execute(input);
  }
}
