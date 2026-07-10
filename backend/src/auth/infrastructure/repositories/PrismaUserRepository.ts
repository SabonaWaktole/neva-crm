import { IUserRepository } from '../../domain/repositories/IUserRepository';
import { User } from '../../domain/entities/User';
import { UserRole } from '../../domain/enums/UserRole';
import { prisma } from '../../../shared/infrastructure/prisma/client';

export class PrismaUserRepository implements IUserRepository {
  async findById(id: string): Promise<User | null> {
    const data = await prisma.user.findUnique({ where: { id } });
    if (!data) return null;
    return User.create({ ...data, role: data.role as UserRole });
  }

  async findByEmail(email: string, tenantId: string): Promise<User | null> {
    const data = await prisma.user.findFirst({ where: { email, tenantId } });
    if (!data) return null;
    return User.create({ ...data, role: data.role as UserRole });
  }

  async findSuperAdminByEmail(email: string): Promise<User | null> {
    const data = await prisma.user.findFirst({ where: { email, role: 'SUPER_ADMIN' } });
    if (!data) return null;
    return User.create({ ...data, role: data.role as UserRole });
  }

  async create(user: User): Promise<User> {
    await prisma.user.create({
      data: {
        id: user.id,
        email: user.email,
        hashedPassword: user.hashedPassword,
        role: user.role,
        tenantId: user.tenantId,
        createdAt: user.createdAt,
      },
    });
    return user;
  }

  async updatePassword(userId: string, hashedPassword: string): Promise<void> {
    await prisma.user.update({
      where: { id: userId },
      data: { hashedPassword },
    });
  }
}
