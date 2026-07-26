import { User } from '../entities/User';

export interface IUserRepository {
  findById(id: string): Promise<User | null>;
  findByEmail(email: string, tenantId: string): Promise<User | null>;
  findAnyByEmail(email: string): Promise<User | null>;
  findSuperAdminByEmail(email: string): Promise<User | null>;
  create(user: User): Promise<User>;
  updatePassword(userId: string, hashedPassword: string): Promise<void>;
  findByTenantId(tenantId: string): Promise<User[]>;
  updateProfile(userId: string, data: { firstName?: string | null; lastName?: string | null; phone?: string | null; email?: string; language?: string | null }): Promise<void>;
  updateRoleAndWarehouse(userId: string, role: string, warehouseId: string | null): Promise<void>;
  /**
   * Soft off-boarding. There is deliberately no `delete`: seven non-nullable
   * columns reference User, so Postgres RESTRICT blocks removal outright and
   * cascading would erase quotations, interactions and audit history.
   */
  setActive(userId: string, isActive: boolean): Promise<void>;
  /**
   * Work still pointing at a user, shown in the deactivation confirmation so
   * the owner sees what will be left unattended.
   */
  countAssignedWork(userId: string): Promise<{ clients: number; upcomingAppointments: number }>;
}
