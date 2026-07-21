import { User } from '../entities/User';

export interface IUserRepository {
  findById(id: string): Promise<User | null>;
  findByEmail(email: string, tenantId: string): Promise<User | null>;
  findAnyByEmail(email: string): Promise<User | null>;
  findSuperAdminByEmail(email: string): Promise<User | null>;
  create(user: User): Promise<User>;
  updatePassword(userId: string, hashedPassword: string): Promise<void>;
  findByTenantId(tenantId: string): Promise<User[]>;
  updateProfile(userId: string, data: { firstName?: string | null; lastName?: string | null; phone?: string | null; email?: string }): Promise<void>;
}
