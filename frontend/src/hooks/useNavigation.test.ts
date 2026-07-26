import { describe, it, expect } from 'vitest';
import { useNavigation } from './useNavigation';

/**
 * The sidebar duplicates a permission decision that really lives in
 * src/routes/index.tsx. These tests pin the two lists together, because when
 * they drift the symptom is a visible link that dead-ends on /unauthorized.
 */
describe('useNavigation', () => {
  const idsFor = (user: any) => useNavigation(user, '/acme/dashboard').map((i) => i.id);

  const OWNER = { role: 'BUSINESS_OWNER' };
  const STAFF = { role: 'STAFF' };
  const STAFF_WITH_WAREHOUSE = { role: 'STAFF', warehouseId: 'w-1' };

  describe('role gating matches the route guards', () => {
    // reports is guarded ['BUSINESS_OWNER', 'SUPER_ADMIN'] in routes/index.tsx.
    it('never offers Reports to STAFF', () => {
      expect(idsFor(STAFF)).not.toContain('reports');
    });

    it('never offers Reports to STAFF who manage a warehouse', () => {
      // The regression: Reports was pushed alongside inventory behind the
      // warehouseId check, so warehouse staff saw a link that always 403'd.
      expect(idsFor(STAFF_WITH_WAREHOUSE)).not.toContain('reports');
    });

    it('still offers Reports to a BUSINESS_OWNER', () => {
      expect(idsFor(OWNER)).toContain('reports');
    });
  });

  describe('warehouse-gated inventory', () => {
    it('hides Products & Stock from staff with no warehouse', () => {
      expect(idsFor(STAFF)).not.toContain('inventory');
    });

    it('shows Products & Stock to staff who manage a warehouse', () => {
      expect(idsFor(STAFF_WITH_WAREHOUSE)).toContain('inventory');
    });
  });

  describe('no links to features that do not exist', () => {
    // There is no Tasks route, page, model or endpoint anywhere in the project.
    // The link was a planning leftover that sent staff to a 404.
    it('never offers My Tasks to any role', () => {
      for (const user of [OWNER, STAFF, STAFF_WITH_WAREHOUSE, { role: 'SUPER_ADMIN' }]) {
        expect(idsFor(user)).not.toContain('tasks');
      }
    });
  });

  describe('settings availability', () => {
    // settings/profile has no RoleGuard, so every staff member can reach it.
    it('offers Settings to every staff member, warehouse or not', () => {
      expect(idsFor(STAFF)).toContain('settings');
      expect(idsFor(STAFF_WITH_WAREHOUSE)).toContain('settings');
    });
  });

  describe('structural guarantees', () => {
    it('emits no duplicate ids, which would collide as React keys', () => {
      for (const user of [OWNER, STAFF, STAFF_WITH_WAREHOUSE, { role: 'SUPER_ADMIN' }, null]) {
        const ids = idsFor(user);
        expect(new Set(ids).size).toBe(ids.length);
      }
    });

    it('does not mutate its module-level source arrays across calls', () => {
      // Guards the by-reference return: a push on a shared array would leak
      // into every later render, for every user.
      const first = idsFor(STAFF_WITH_WAREHOUSE);
      idsFor(STAFF_WITH_WAREHOUSE);
      idsFor(OWNER);
      const afterwards = idsFor(STAFF_WITH_WAREHOUSE);

      expect(afterwards).toEqual(first);
      expect(idsFor(OWNER)).toEqual([
        'dashboard', 'clients', 'appointments', 'inventory', 'quotations', 'reports', 'settings',
      ]);
    });

    it('returns a fresh array each call', () => {
      expect(idsFor(OWNER)).not.toBe(idsFor(OWNER));
    });
  });
});
