import { describe, it, expect } from 'vitest';
import { useNavigation } from './useNavigation';

/**
 * The sidebar duplicates a permission decision that really lives in
 * src/routes/index.tsx. These tests pin the two lists together, because when
 * they drift the symptom is a visible link that dead-ends on /unauthorized.
 */
describe('useNavigation', () => {
  /*
   * `useNavigation` is a pure function of its arguments — it calls no React
   * hooks — so invoking it directly is correct and no renderer is needed.
   * The linter cannot see that and flags the anonymous arrow as a component
   * calling a hook. Disabled here rather than downgrading the rule, which is
   * genuinely useful everywhere else. See TD-018.
   */
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const idsFor = (user: any) => useNavigation(user, '/acme/dashboard').map((i) => i.id);

  const OWNER = { role: 'BUSINESS_OWNER' };
  const STAFF = { role: 'STAFF' };
  const STAFF_WITH_WAREHOUSE = { role: 'STAFF', warehouseId: 'w-1' };
  const SUPER_ADMIN = { role: 'SUPER_ADMIN' };

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

  /*
   * SUPER_ADMIN is a platform-level role with zero access to any individual
   * tenant's business data — enforced in resolveTenant, which returns 403 for
   * it on every /:tenantSlug/... endpoint. It used to inherit the owner list
   * because the hook branched only on `role === 'STAFF'`, so the console
   * offered six links the backend was designed to refuse. TD-008.
   */
  describe('super admin gets a platform list, not the owner one', () => {
    it('offers exactly Dashboard and Tenants', () => {
      expect(idsFor(SUPER_ADMIN)).toEqual(['dashboard', 'tenants']);
    });

    it.each(['clients', 'appointments', 'inventory', 'quotations', 'reports', 'settings'])(
      'never offers %s, which resolveTenant would refuse',
      (id) => {
        expect(idsFor(SUPER_ADMIN)).not.toContain(id);
      }
    );

    it('offers Tenants to nobody else — it is SUPER_ADMIN-only server-side', () => {
      for (const user of [OWNER, STAFF, STAFF_WITH_WAREHOUSE, null]) {
        expect(idsFor(user)).not.toContain('tenants');
      }
    });
  });

  describe('active-state highlighting', () => {
    // Same pure-function-not-a-hook situation as idsFor above. See TD-018.
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const activeIdsAt = (user: any, path: string) => useNavigation(user, path)
      .filter((i) => i.isActive)
      .map((i) => i.id);

    it('highlights Tenants alone on the tenants page', () => {
      // The fallback used to be a hand-listed set of exclusions naming only
      // clients, settings and appointments — so any other page lit up Dashboard
      // as well as itself.
      expect(activeIdsAt(SUPER_ADMIN, '/admin/tenants')).toEqual(['tenants']);
    });

    it('highlights Dashboard alone on the dashboard', () => {
      expect(activeIdsAt(SUPER_ADMIN, '/admin/dashboard')).toEqual(['dashboard']);
    });

    it('does not also highlight Dashboard on a deep owner page', () => {
      expect(activeIdsAt(OWNER, '/acme/inventory')).toEqual(['inventory']);
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
