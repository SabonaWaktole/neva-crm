import { AcceptInvitationUseCase } from '@auth/application/use-cases/AcceptInvitationUseCase';
import { IInvitationRepository } from '@auth/domain/repositories/IInvitationRepository';
import { IUserRepository } from '@auth/domain/repositories/IUserRepository';
import { IPasswordHasher } from '@auth/application/ports/IPasswordHasher';
import { UserRole } from '@auth/domain/enums/UserRole';
import { InvitationExpiredError, InvitationAlreadyAcceptedError } from '@auth/domain/errors';
import { Invitation } from '@auth/domain/entities/Invitation';

describe('AcceptInvitationUseCase', () => {
  let useCase: AcceptInvitationUseCase;
  let invitationRepository: jest.Mocked<IInvitationRepository>;
  let userRepository: jest.Mocked<IUserRepository>;
  let passwordHasher: jest.Mocked<IPasswordHasher>;

  beforeEach(() => {
    invitationRepository = {
      create: jest.fn(),
      findByToken: jest.fn(),
      markAccepted: jest.fn(),
    };
    userRepository = {
      create: jest.fn(),
      findById: jest.fn(),
      findByEmail: jest.fn(),
      findSuperAdminByEmail: jest.fn(),
      updatePassword: jest.fn(),
    };
    passwordHasher = {
      hash: jest.fn(),
      compare: jest.fn(),
    };

    useCase = new AcceptInvitationUseCase(invitationRepository, userRepository, passwordHasher);
  });

  it('should accept an invitation and create a user', async () => {
    const invitation = Invitation.create({
      id: 'inv-1',
      tenantId: 'tenant-1',
      email: 'staff@example.com',
      role: UserRole.STAFF,
      token: 'valid-token',
      expiresAt: new Date(Date.now() + 86400000), // future
      acceptedAt: null,
    });

    invitationRepository.findByToken.mockResolvedValue(invitation);
    passwordHasher.hash.mockResolvedValue('hashed-pass');
    userRepository.create.mockImplementation(async (user) => user);

    const user = await useCase.execute({
      token: 'valid-token',
      newPassword: 'StrongPassword123!',
    });

    expect(user.email).toBe('staff@example.com');
    expect(user.role).toBe(UserRole.STAFF);
    expect(user.tenantId).toBe('tenant-1');
    expect(invitationRepository.markAccepted).toHaveBeenCalledWith('inv-1', expect.any(Date));
    expect(userRepository.create).toHaveBeenCalled();
  });

  it('should throw InvitationExpiredError if token is expired', async () => {
    const invitation = Invitation.create({
      id: 'inv-1',
      tenantId: 'tenant-1',
      email: 'staff@example.com',
      role: UserRole.STAFF,
      token: 'expired-token',
      expiresAt: new Date(Date.now() - 1000), // past
      acceptedAt: null,
    });
    invitationRepository.findByToken.mockResolvedValue(invitation);

    await expect(useCase.execute({ token: 'expired-token', newPassword: 'StrongPassword123!' }))
      .rejects.toThrow(InvitationExpiredError);
  });
  
  it('should throw InvitationAlreadyAcceptedError if already accepted', async () => {
    const invitation = Invitation.create({
      id: 'inv-1',
      tenantId: 'tenant-1',
      email: 'staff@example.com',
      role: UserRole.STAFF,
      token: 'used-token',
      expiresAt: new Date(Date.now() + 86400000), 
      acceptedAt: new Date(), // accepted
    });
    invitationRepository.findByToken.mockResolvedValue(invitation);

    await expect(useCase.execute({ token: 'used-token', newPassword: 'StrongPassword123!' }))
      .rejects.toThrow(InvitationAlreadyAcceptedError);
  });
});
