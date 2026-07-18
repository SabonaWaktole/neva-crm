import { IClientRepository } from '../../domain/repositories/IClientRepository';
import { IInteractionRepository } from '../../domain/repositories/IInteractionRepository';
import { IAppointmentRepository } from '../../../appointments/domain/repositories/IAppointmentRepository';
import { Interaction } from '../../domain/entities/Interaction';
import { Appointment } from '../../../appointments/domain/entities/Appointment';
import { DomainError } from '../../../shared/domain/errors/DomainError';

import { TimelineMerger } from '../../../shared/application/TimelineMerger';

interface GetClientHistoryDTO {
  tenantId: string;
  clientId: string;
}

export class GetClientHistoryUseCase {
  constructor(
    private clientRepo: IClientRepository,
    private interactionRepo: IInteractionRepository,
    private appointmentRepo?: IAppointmentRepository
  ) {}

  async execute(dto: GetClientHistoryDTO): Promise<{ timeline: any[] }> {
    const client = await this.clientRepo.findById(dto.tenantId, dto.clientId);
    if (!client || client.tenantId !== dto.tenantId) {
      throw new DomainError('Client not found or access denied');
    }

    const interactions = await this.interactionRepo.findByClientId(dto.tenantId, dto.clientId);
    const appointments = this.appointmentRepo ? await this.appointmentRepo.findByClientId(dto.clientId, dto.tenantId) : [];

    const timeline = TimelineMerger.merge(interactions, appointments);

    return { timeline };
  }
}
