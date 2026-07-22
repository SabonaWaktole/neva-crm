import { IInvitationRepository } from '../../domain/repositories/IInvitationRepository';
import { UserRole } from '../../domain/enums/UserRole';
import { UnauthorizedError } from '../../domain/errors';

export class CancelInvitationUseCase {
  constructor(private invitationRepository: IInvitationRepository) {}

  async execute(input: { invitationId: string; requestingUserRole: string }) {
    if (input.requestingUserRole !== UserRole.BUSINESS_OWNER && input.requestingUserRole !== UserRole.SUPER_ADMIN) {
      throw new UnauthorizedError('Only Business Owners can cancel invitations');
    }

    await this.invitationRepository.delete(input.invitationId);
  }
}
