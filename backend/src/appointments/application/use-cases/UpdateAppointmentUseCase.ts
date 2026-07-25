import { IAppointmentRepository } from '../../domain/repositories/IAppointmentRepository';
import { IClientRepository } from '../../../clients/domain/repositories/IClientRepository';
import { IUserRepository } from '../../../auth/domain/repositories/IUserRepository';
import { Appointment } from '../../domain/entities/Appointment';

export interface UpdateAppointmentDTO {
  id: string;
  tenantId: string;
  clientId?: string;
  assignedUserId?: string;
  scheduledAt?: Date;
  notes?: string;
}

export class UpdateAppointmentUseCase {
  constructor(
    private readonly appointmentRepository: IAppointmentRepository,
    private readonly clientRepository: IClientRepository,
    private readonly userRepository: IUserRepository
  ) {}

  async execute(dto: UpdateAppointmentDTO): Promise<Appointment> {
    const appointment = await this.appointmentRepository.findById(dto.id, dto.tenantId);
    if (!appointment) {
      throw new Error('Appointment not found');
    }

    if (dto.clientId && dto.clientId !== appointment.clientId) {
      const client = await this.clientRepository.findById(dto.clientId, dto.tenantId);
      if (!client) {
        throw new Error('Invalid client');
      }
    }

    if (dto.assignedUserId && dto.assignedUserId !== appointment.assignedUserId) {
      const user = await this.userRepository.findById(dto.assignedUserId);
      if (!user || user.tenantId !== dto.tenantId) {
        throw new Error('Invalid assigned user');
      }
    }

    appointment.updateDetails({
      clientId: dto.clientId,
      assignedUserId: dto.assignedUserId,
      scheduledAt: dto.scheduledAt,
      notes: dto.notes,
    });

    await this.appointmentRepository.update(appointment);
    return appointment;
  }
}

