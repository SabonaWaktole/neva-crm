import { Invitation } from '@auth/domain/entities/Invitation';
import { UserRole } from '@auth/domain/enums/UserRole';

describe('Invitation Entity', () => {
  const baseProps = {
    id: 'inv-001',
    tenantId: 'tenant-100',
    email: 'invitee@example.com',
    role: UserRole.STAFF,
    token: 'random-token-abc',
  };

  describe('create', () => {
    it('should create an Invitation with all provided properties', () => {
      const expiresAt = new Date('2027-01-01T00:00:00Z');
      const invitation = Invitation.create({
        ...baseProps,
        expiresAt,
        acceptedAt: null,
      });

      expect(invitation.id).toBe(baseProps.id);
      expect(invitation.tenantId).toBe(baseProps.tenantId);
      expect(invitation.email).toBe(baseProps.email);
      expect(invitation.role).toBe(UserRole.STAFF);
      expect(invitation.token).toBe(baseProps.token);
      expect(invitation.expiresAt).toEqual(expiresAt);
      expect(invitation.acceptedAt).toBeNull();
    });

    it('should create an Invitation that has been accepted', () => {
      const acceptedAt = new Date('2026-06-15T12:00:00Z');
      const invitation = Invitation.create({
        ...baseProps,
        expiresAt: new Date('2027-01-01T00:00:00Z'),
        acceptedAt,
      });

      expect(invitation.acceptedAt).toEqual(acceptedAt);
    });
  });

  describe('isExpired', () => {
    it('should return true when expiresAt is in the past', () => {
      const invitation = Invitation.create({
        ...baseProps,
        expiresAt: new Date('2020-01-01T00:00:00Z'),
        acceptedAt: null,
      });

      expect(invitation.isExpired()).toBe(true);
    });

    it('should return false when expiresAt is in the future', () => {
      const invitation = Invitation.create({
        ...baseProps,
        expiresAt: new Date('2099-12-31T23:59:59Z'),
        acceptedAt: null,
      });

      expect(invitation.isExpired()).toBe(false);
    });
  });

  describe('isAccepted', () => {
    it('should return true when acceptedAt is not null', () => {
      const invitation = Invitation.create({
        ...baseProps,
        expiresAt: new Date('2027-01-01T00:00:00Z'),
        acceptedAt: new Date('2026-06-01T00:00:00Z'),
      });

      expect(invitation.isAccepted()).toBe(true);
    });

    it('should return false when acceptedAt is null', () => {
      const invitation = Invitation.create({
        ...baseProps,
        expiresAt: new Date('2027-01-01T00:00:00Z'),
        acceptedAt: null,
      });

      expect(invitation.isAccepted()).toBe(false);
    });
  });
});
