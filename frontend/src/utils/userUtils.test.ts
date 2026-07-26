import { describe, it, expect } from 'vitest';
import { findPersonById, getStaffDisplayName, getStaffInitials } from './userUtils';

/**
 * These back the assignee display. The bug they replace rendered
 * `client.assignedUserId` directly — a raw UUID where a person's name belongs,
 * and `uuid.substring(0, 2)` as the avatar initials.
 */
describe('staff display helpers', () => {
  const full = { id: 'u-1', email: 'ada@example.com', firstName: 'Ada', lastName: 'Lovelace' };
  const emailOnly = { id: 'u-2', email: 'grace@example.com' };
  const bare = { id: '0191c2de-0000-7000-8000-000000000000' };

  describe('getStaffDisplayName', () => {
    it('prefers the full name', () => {
      expect(getStaffDisplayName(full)).toBe('Ada Lovelace');
    });

    it('falls back to email when no name is set', () => {
      expect(getStaffDisplayName(emailOnly)).toBe('grace@example.com');
    });

    it('uses a first name alone', () => {
      expect(getStaffDisplayName({ id: 'u-3', firstName: 'Ada' })).toBe('Ada');
    });

    it('never renders a bare UUID', () => {
      const rendered = getStaffDisplayName(bare);
      expect(rendered).not.toBe(bare.id);
      expect(rendered).toContain('User');
    });

    it('reads as Unassigned for a missing person', () => {
      expect(getStaffDisplayName(undefined)).toBe('Unassigned');
      expect(getStaffDisplayName(null)).toBe('Unassigned');
    });
  });

  describe('getStaffInitials', () => {
    it('uses first and last initials', () => {
      expect(getStaffInitials(full)).toBe('AL');
    });

    it('falls back to the email prefix', () => {
      expect(getStaffInitials(emailOnly)).toBe('GR');
    });

    it('returns UN for a missing person rather than UUID characters', () => {
      expect(getStaffInitials(undefined)).toBe('UN');
      expect(getStaffInitials(bare)).toBe('UN');
    });
  });

  describe('findPersonById', () => {
    const people = [full, emailOnly];

    it('finds a person by id', () => {
      expect(findPersonById(people, 'u-2')).toBe(emailOnly);
    });

    it('returns undefined for an unassigned client', () => {
      expect(findPersonById(people, null)).toBeUndefined();
      expect(findPersonById(people, undefined)).toBeUndefined();
    });

    it('returns undefined when the assignee is no longer in the staff list', () => {
      // e.g. the assignee left the tenant; the UI must degrade, not crash.
      expect(findPersonById(people, 'u-gone')).toBeUndefined();
    });

    it('tolerates the staff list not having loaded yet', () => {
      expect(findPersonById(undefined, 'u-1')).toBeUndefined();
    });
  });
});
