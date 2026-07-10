import { User } from '@auth/domain/entities/User';
import { UserRole } from '@auth/domain/enums/UserRole';

describe('User Entity', () => {
  const baseProps = {
    id: 'user-123',
    email: 'user@example.com',
    hashedPassword: 'hashed_password_value',
    createdAt: new Date('2026-01-01T00:00:00Z'),
  };

  describe('create', () => {
    it('should create a SUPER_ADMIN with null tenantId', () => {
      const user = User.create({
        ...baseProps,
        role: UserRole.SUPER_ADMIN,
        tenantId: null,
      });

      expect(user.id).toBe(baseProps.id);
      expect(user.email).toBe(baseProps.email);
      expect(user.hashedPassword).toBe(baseProps.hashedPassword);
      expect(user.role).toBe(UserRole.SUPER_ADMIN);
      expect(user.tenantId).toBeNull();
      expect(user.createdAt).toEqual(baseProps.createdAt);
    });

    it('should create a BUSINESS_OWNER with a tenantId', () => {
      const user = User.create({
        ...baseProps,
        role: UserRole.BUSINESS_OWNER,
        tenantId: 'tenant-456',
      });

      expect(user.id).toBe(baseProps.id);
      expect(user.role).toBe(UserRole.BUSINESS_OWNER);
      expect(user.tenantId).toBe('tenant-456');
    });

    it('should create a STAFF with a tenantId', () => {
      const user = User.create({
        ...baseProps,
        role: UserRole.STAFF,
        tenantId: 'tenant-789',
      });

      expect(user.role).toBe(UserRole.STAFF);
      expect(user.tenantId).toBe('tenant-789');
    });
  });

  describe('role-tenantId invariants', () => {
    it('should throw an error when SUPER_ADMIN has a tenantId', () => {
      expect(() =>
        User.create({
          ...baseProps,
          role: UserRole.SUPER_ADMIN,
          tenantId: 'tenant-456',
        }),
      ).toThrow();
    });

    it('should throw an error when BUSINESS_OWNER has null tenantId', () => {
      expect(() =>
        User.create({
          ...baseProps,
          role: UserRole.BUSINESS_OWNER,
          tenantId: null,
        }),
      ).toThrow();
    });

    it('should throw an error when STAFF has null tenantId', () => {
      expect(() =>
        User.create({
          ...baseProps,
          role: UserRole.STAFF,
          tenantId: null,
        }),
      ).toThrow();
    });
  });
});
