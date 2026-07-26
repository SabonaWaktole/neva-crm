import { IClientRepository } from '../../../clients/domain/repositories/IClientRepository';
import { IInteractionRepository } from '../../../clients/domain/repositories/IInteractionRepository';
import { IAppointmentRepository } from '../../../appointments/domain/repositories/IAppointmentRepository';
import { TimelineMerger } from '../../../shared/application/TimelineMerger';

export interface GetTenantActivityFeedDTO {
  tenantId: string;
  /** The requesting user. Only used when their role scopes them to own data. */
  userId?: string;
  /** Requesting user's role. STAFF sees only their own activity. */
  role?: string;
  limit?: number;
}

export class GetTenantActivityFeedUseCase {
  constructor(
    private clientRepo: IClientRepository,
    private interactionRepo: IInteractionRepository,
    private appointmentRepo: IAppointmentRepository
  ) {}

  async execute(dto: GetTenantActivityFeedDTO) {
    const limit = dto.limit ?? 20;

    // Role-based visibility, matching GetUpcomingAppointmentsUseCase: STAFF see
    // only their own activity, BUSINESS_OWNER sees the whole tenant. Decided
    // here rather than in the route so the policy lives with the business rules
    // and cannot be forgotten by a second caller.
    const scopedUserId = dto.role === 'STAFF' ? dto.userId : undefined;

    // We fetch `limit` from each to ensure we don't miss anything if one is full of recent events
    const [clients, interactions, appointments] = await Promise.all([
      this.clientRepo.findRecentByTenant(dto.tenantId, limit, scopedUserId),
      this.interactionRepo.findRecentByTenant(dto.tenantId, limit, scopedUserId),
      this.appointmentRepo.findRecentByTenant(dto.tenantId, limit, scopedUserId),
    ]);

    const timeline = TimelineMerger.merge(interactions, appointments, clients, { limit });

    return { timeline };
  }
}
