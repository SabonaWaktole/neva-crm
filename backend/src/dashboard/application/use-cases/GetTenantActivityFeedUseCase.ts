import { IClientRepository } from '../../../clients/domain/repositories/IClientRepository';
import { IInteractionRepository } from '../../../clients/domain/repositories/IInteractionRepository';
import { IAppointmentRepository } from '../../../appointments/domain/repositories/IAppointmentRepository';
import { TimelineMerger } from '../../../shared/application/TimelineMerger';

export interface GetTenantActivityFeedDTO {
  tenantId: string;
  userId?: string;
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

    // We fetch `limit` from each to ensure we don't miss anything if one is full of recent events
    const [clients, interactions, appointments] = await Promise.all([
      this.clientRepo.findRecentByTenant(dto.tenantId, limit, dto.userId),
      this.interactionRepo.findRecentByTenant(dto.tenantId, limit, dto.userId),
      this.appointmentRepo.findRecentByTenant(dto.tenantId, limit, dto.userId),
    ]);

    const timeline = TimelineMerger.merge(interactions, appointments, clients, { limit });

    return { timeline };
  }
}
