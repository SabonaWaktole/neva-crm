import { IAppointmentRepository } from '../../domain/repositories/IAppointmentRepository';
import { Appointment } from '../../domain/entities/Appointment';
import { DomainError } from '../../../shared/domain/errors/DomainError';

export interface CreateAppointmentDTO {
  tenantId: string;
  clientId: string;
  assignedUserId: string;
  scheduledAt: Date;
  notes?: string;
}

export class CreateAppointmentUseCase {
  constructor(
    private readonly appointmentRepository: IAppointmentRepository,
    private readonly clientRepository: any, // IClientRepository in reality
    private readonly userRepository: any // IUserRepository in reality
  ) {}

  async execute(dto: CreateAppointmentDTO): Promise<{ id: string; status: string; tenantId: string }> {
    const client = await this.clientRepository.findById(dto.tenantId, dto.clientId);
    if (!client) {
      throw new Error('Client not found');
    }
    if (client.tenantId !== dto.tenantId) {
      throw new DomainError('Client does not belong to this tenant');
    }

    const user = await this.userRepository.findById(dto.assignedUserId);
    if (!user) {
      throw new Error('Assigned user not found');
    }
    if (user.tenantId !== dto.tenantId) {
      throw new DomainError('Assigned user does not belong to this tenant');
    }

    const appointment = Appointment.create({
      id: crypto.randomUUID(), // Assuming a UUID generator or pass it in
      tenantId: dto.tenantId,
      clientId: dto.clientId,
      assignedUserId: dto.assignedUserId,
      scheduledAt: dto.scheduledAt,
      notes: dto.notes,
      clientTenantId: client.tenantId,
      assignedUserTenantId: user.tenantId,
    });

    await this.appointmentRepository.save(appointment);

    return {
      id: appointment.id,
      status: appointment.status,
      tenantId: appointment.tenantId,
    };
  }
}
