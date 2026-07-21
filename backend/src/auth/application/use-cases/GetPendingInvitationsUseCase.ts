import { IInvitationRepository } from '../../domain/repositories/IInvitationRepository';
import { UserRole } from '../../domain/enums/UserRole';
import { UnauthorizedError } from '../../domain/errors';

export class GetPendingInvitationsUseCase {
  constructor(private invitationRepository: IInvitationRepository) {}

  async execute(input: { tenantId: string; requestingUserRole: UserRole }) {
    if (input.requestingUserRole !== UserRole.BUSINESS_OWNER && input.requestingUserRole !== UserRole.SUPER_ADMIN) {
      throw new UnauthorizedError('Only Business Owners can view invitations');
    }

    const invitations = await this.invitationRepository.findByTenantId(input.tenantId);
    
    // Filter out accepted ones or expired ones
    const now = new Date();
    const pendingInvitations = invitations.filter(inv => !inv.acceptedAt && inv.expiresAt > now);

    return pendingInvitations.map(inv => ({
      id: inv.id,
      email: inv.email,
      role: inv.role,
      expiresAt: inv.expiresAt,
    }));
  }
}
