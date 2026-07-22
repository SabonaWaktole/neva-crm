import { IInvitationRepository } from '../../domain/repositories/IInvitationRepository';
import { IEmailSender } from '../ports/IEmailSender';
import { UserRole } from '../../domain/enums/UserRole';
import { UnauthorizedError } from '../../domain/errors';
import { Invitation } from '../../domain/entities/Invitation';
import { v4 as uuidv4 } from 'uuid';
import * as crypto from 'crypto';

export class InviteStaffUseCase {
  constructor(
    private invitationRepository: IInvitationRepository,
    private emailSender: IEmailSender
  ) {}

  async execute(input: any) {
    if (input.invitingUserRole !== UserRole.BUSINESS_OWNER && input.invitingUserRole !== UserRole.SUPER_ADMIN) {
      throw new UnauthorizedError('Only Business Owners can invite staff');
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    const invitation = Invitation.create({
      id: uuidv4(),
      tenantId: input.tenantId,
      email: input.inviteeEmail,
      role: input.role,
      token,
      expiresAt,
      acceptedAt: null,
      warehouseId: input.warehouseId || null,
    });

    await this.invitationRepository.create(invitation);
    await this.emailSender.sendInvitationEmail(input.inviteeEmail, token, input.tenantName);

    return { email: input.inviteeEmail, token };
  }
}
