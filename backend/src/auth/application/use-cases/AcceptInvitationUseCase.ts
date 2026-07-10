import { IInvitationRepository } from '../../domain/repositories/IInvitationRepository';
import { IUserRepository } from '../../domain/repositories/IUserRepository';
import { IPasswordHasher } from '../ports/IPasswordHasher';
import { InvitationExpiredError, InvitationAlreadyAcceptedError } from '../../domain/errors';
import { User } from '../../domain/entities/User';
import { Password } from '../../domain/value-objects/Password';
import { v4 as uuidv4 } from 'uuid';

export class AcceptInvitationUseCase {
  constructor(
    private invitationRepository: IInvitationRepository,
    private userRepository: IUserRepository,
    private passwordHasher: IPasswordHasher
  ) {}

  async execute(input: any) {
    const invitation = await this.invitationRepository.findByToken(input.token);
    if (!invitation) throw new Error('Invitation not found'); // Or custom error

    if (invitation.isExpired()) throw new InvitationExpiredError();
    if (invitation.isAccepted()) throw new InvitationAlreadyAcceptedError();

    const password = new Password(input.newPassword);
    const hashedPassword = await this.passwordHasher.hash(password.value);

    const user = User.create({
      id: uuidv4(),
      email: invitation.email,
      hashedPassword,
      role: invitation.role,
      tenantId: invitation.tenantId,
      createdAt: new Date(),
    });

    await this.userRepository.create(user);
    await this.invitationRepository.markAccepted(invitation.id, new Date());

    return user;
  }
}
