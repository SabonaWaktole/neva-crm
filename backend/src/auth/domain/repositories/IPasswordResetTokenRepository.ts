import { PasswordResetToken } from '../entities/PasswordResetToken';

export interface IPasswordResetTokenRepository {
  create(token: PasswordResetToken): Promise<PasswordResetToken>;
  findByToken(token: string): Promise<PasswordResetToken | null>;
  markUsed(id: string, usedAt: Date): Promise<void>;
}
