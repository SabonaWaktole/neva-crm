import { IUserRepository } from '../../domain/repositories/IUserRepository';
import { IPasswordHasher } from '../ports/IPasswordHasher';
import { Password } from '../../domain/value-objects/Password';
import { UnauthorizedError } from '../../domain/errors';

export interface ChangePasswordInput {
  userId: string;
  currentPassword: string;
  newPassword: string;
}

/**
 * An authenticated user changing their own password, as opposed to
 * ResetPasswordUseCase, which is driven by an emailed token for a user who
 * cannot log in at all. Verifying `currentPassword` here is what stands in
 * for the reset token's proof of ownership.
 */
export class ChangePasswordUseCase {
  constructor(
    private userRepository: IUserRepository,
    private passwordHasher: IPasswordHasher
  ) {}

  async execute(input: ChangePasswordInput): Promise<void> {
    const user = await this.userRepository.findById(input.userId);
    if (!user) {
      throw new Error('User not found');
    }

    const isCurrentPasswordValid = await this.passwordHasher.compare(
      input.currentPassword,
      user.hashedPassword
    );
    if (!isCurrentPasswordValid) {
      throw new UnauthorizedError('Current password is incorrect');
    }

    const newPassword = new Password(input.newPassword);
    const hashedPassword = await this.passwordHasher.hash(newPassword.value);

    await this.userRepository.updatePassword(input.userId, hashedPassword);
  }
}
