import { IPasswordResetTokenRepository } from '../../domain/repositories/IPasswordResetTokenRepository';
import { IUserRepository } from '../../domain/repositories/IUserRepository';
import { IPasswordHasher } from '../ports/IPasswordHasher';
import { Password } from '../../domain/value-objects/Password';
import { TokenExpiredError, TokenAlreadyUsedError } from '../../domain/errors';

export class ResetPasswordUseCase {
  constructor(
    private prtRepository: IPasswordResetTokenRepository,
    private userRepository: IUserRepository,
    private passwordHasher: IPasswordHasher
  ) {}

  async execute(input: any) {
    const prt = await this.prtRepository.findByToken(input.token);
    if (!prt) throw new Error('Token not found');

    if (prt.isExpired()) throw new TokenExpiredError();
    if (prt.isUsed()) throw new TokenAlreadyUsedError();

    const password = new Password(input.newPassword);
    const hashedPassword = await this.passwordHasher.hash(password.value);

    await this.userRepository.updatePassword(prt.userId, hashedPassword);
    await this.prtRepository.markUsed(prt.id, new Date());
  }
}
