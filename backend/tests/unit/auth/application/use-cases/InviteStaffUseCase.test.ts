import { InviteStaffUseCase } from '@auth/application/use-cases/InviteStaffUseCase';
import { IInvitationRepository } from '@auth/domain/repositories/IInvitationRepository';
import { IEmailSender } from '@auth/application/ports/IEmailSender';
import { UserRole } from '@auth/domain/enums/UserRole';
import { UnauthorizedError } from '@auth/domain/errors';

describe('InviteStaffUseCase', () => {
  let useCase: InviteStaffUseCase;
  let invitationRepository: jest.Mocked<IInvitationRepository>;
  let emailSender: jest.Mocked<IEmailSender>;

  beforeEach(() => {
    invitationRepository = {
      create: jest.fn(),
      findByToken: jest.fn(),
      findByTenantId: jest.fn(),
      markAccepted: jest.fn(),
    };
    emailSender = {
      sendInvitationEmail: jest.fn(),
      sendPasswordResetEmail: jest.fn(),
    };

    useCase = new InviteStaffUseCase(invitationRepository, emailSender);
  });

  it('should successfully invite a staff member', async () => {
    invitationRepository.create.mockImplementation(async (invitation) => invitation);

    const result = await useCase.execute({
      invitingUserId: 'owner-1',
      invitingUserRole: UserRole.BUSINESS_OWNER,
      tenantId: 'tenant-1',
      inviteeEmail: 'staff@example.com',
      role: UserRole.STAFF,
      tenantName: 'Acme Corp',
    });

    expect(invitationRepository.create).toHaveBeenCalled();
    expect(emailSender.sendInvitationEmail).toHaveBeenCalledWith('staff@example.com', expect.any(String), 'Acme Corp');
    expect(result.email).toBe('staff@example.com');
    expect(result.token).toBeDefined();
  });

  it('should throw UnauthorizedError if inviter is not BUSINESS_OWNER or SUPER_ADMIN', async () => {
    await expect(
      useCase.execute({
        invitingUserId: 'staff-1',
        invitingUserRole: UserRole.STAFF,
        tenantId: 'tenant-1',
        inviteeEmail: 'staff2@example.com',
        role: UserRole.STAFF,
        tenantName: 'Acme Corp',
      })
    ).rejects.toThrow(UnauthorizedError);
  });
});
