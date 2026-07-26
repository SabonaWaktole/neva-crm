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

  async findAnyByEmail(email: string): Promise<User | null> {
    const data = await prisma.user.findFirst({ where: { email } });
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
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        role: user.role,
        tenantId: user.tenantId,
        warehouseId: user.warehouseId,
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

  async updateProfile(userId: string, data: { firstName?: string | null; lastName?: string | null; phone?: string | null; email?: string; language?: string | null }): Promise<void> {
    await prisma.user.update({
      where: { id: userId },
      data,
    });
  }

  async findByTenantId(tenantId: string): Promise<User[]> {
    const data = await prisma.user.findMany({ where: { tenantId } });
    return data.map(u => User.create({ ...u, role: u.role as UserRole }));
  }

  async updateRoleAndWarehouse(userId: string, role: string, warehouseId: string | null): Promise<void> {
    await prisma.user.update({
      where: { id: userId },
      data: { role, warehouseId },
    });
  }

  async setActive(userId: string, isActive: boolean): Promise<void> {
    await prisma.user.update({
      where: { id: userId },
      data: { isActive },
    });
  }

  async countAssignedWork(userId: string): Promise<{ clients: number; upcomingAppointments: number }> {
    // Only work that would actually go unattended is counted: currently
    // assigned clients, and appointments still ahead that are not cancelled.
    // Past and cancelled appointments are history, not a handover concern.
    const [clients, upcomingAppointments] = await Promise.all([
      prisma.client.count({ where: { assignedUserId: userId } }),
      prisma.appointment.count({
        where: {
          assignedUserId: userId,
          scheduledAt: { gte: new Date() },
          status: { in: ['SCHEDULED', 'CONFIRMED'] },
        },
      }),
    ]);

    return { clients, upcomingAppointments };
  }
}
