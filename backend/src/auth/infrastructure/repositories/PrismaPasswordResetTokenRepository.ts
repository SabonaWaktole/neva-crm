import { IPasswordResetTokenRepository } from '../../domain/repositories/IPasswordResetTokenRepository';
import { PasswordResetToken } from '../../domain/entities/PasswordResetToken';
import { prisma } from '../../../shared/infrastructure/prisma/client';

export class PrismaPasswordResetTokenRepository implements IPasswordResetTokenRepository {
  async create(token: PasswordResetToken): Promise<PasswordResetToken> {
    await prisma.passwordResetToken.create({
      data: {
        id: token.id,
        userId: token.userId,
        token: token.token,
        expiresAt: token.expiresAt,
        usedAt: token.usedAt,
      },
    });
    return token;
  }

  async findByToken(token: string): Promise<PasswordResetToken | null> {
    const data = await prisma.passwordResetToken.findUnique({ where: { token } });
    if (!data) return null;
    return PasswordResetToken.create(data);
  }

  async markUsed(id: string, usedAt: Date): Promise<void> {
    await prisma.passwordResetToken.update({
      where: { id },
      data: { usedAt },
    });
  }
}
