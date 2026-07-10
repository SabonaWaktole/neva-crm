import { PasswordResetToken } from '@auth/domain/entities/PasswordResetToken';

describe('PasswordResetToken Entity', () => {
  const baseProps = {
    id: 'prt-001',
    userId: 'user-123',
    token: 'reset-token-xyz',
  };

  describe('create', () => {
    it('should create a PasswordResetToken with all provided properties', () => {
      const expiresAt = new Date('2027-06-01T00:00:00Z');
      const prt = PasswordResetToken.create({
        ...baseProps,
        expiresAt,
        usedAt: null,
      });

      expect(prt.id).toBe(baseProps.id);
      expect(prt.userId).toBe(baseProps.userId);
      expect(prt.token).toBe(baseProps.token);
      expect(prt.expiresAt).toEqual(expiresAt);
      expect(prt.usedAt).toBeNull();
    });

    it('should create a PasswordResetToken that has been used', () => {
      const usedAt = new Date('2026-07-01T08:00:00Z');
      const prt = PasswordResetToken.create({
        ...baseProps,
        expiresAt: new Date('2027-06-01T00:00:00Z'),
        usedAt,
      });

      expect(prt.usedAt).toEqual(usedAt);
    });
  });

  describe('isExpired', () => {
    it('should return true when expiresAt is in the past', () => {
      const prt = PasswordResetToken.create({
        ...baseProps,
        expiresAt: new Date('2020-01-01T00:00:00Z'),
        usedAt: null,
      });

      expect(prt.isExpired()).toBe(true);
    });

    it('should return false when expiresAt is in the future', () => {
      const prt = PasswordResetToken.create({
        ...baseProps,
        expiresAt: new Date('2099-12-31T23:59:59Z'),
        usedAt: null,
      });

      expect(prt.isExpired()).toBe(false);
    });
  });

  describe('isUsed', () => {
    it('should return true when usedAt is not null', () => {
      const prt = PasswordResetToken.create({
        ...baseProps,
        expiresAt: new Date('2027-06-01T00:00:00Z'),
        usedAt: new Date('2026-07-01T10:00:00Z'),
      });

      expect(prt.isUsed()).toBe(true);
    });

    it('should return false when usedAt is null', () => {
      const prt = PasswordResetToken.create({
        ...baseProps,
        expiresAt: new Date('2027-06-01T00:00:00Z'),
        usedAt: null,
      });

      expect(prt.isUsed()).toBe(false);
    });
  });
});
