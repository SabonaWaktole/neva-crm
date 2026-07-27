import type { NavItem } from '../components/layout/Sidebar/Sidebar';

/**
 * Sidebar contents per role.
 *
 * These lists must mirror the role gating in src/routes/index.tsx. A link the
 * route layer denies is worse than no link: it looks available and lands the
 * user on /unauthorized. Reports is the case in point — it is guarded
 * `['BUSINESS_OWNER', 'SUPER_ADMIN']` there, so it must not appear for STAFF.
 */
const ownerNavItems: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: 'dashboard' },
  { id: 'clients', label: 'Clients', icon: 'group' },
  { id: 'appointments', label: 'Appointments', icon: 'event' },
  { id: 'inventory', label: 'Products & Stock', icon: 'inventory_2' },
  { id: 'quotations', label: 'Quotations', icon: 'description' },
  { id: 'reports', label: 'Reports', icon: 'bar_chart' },
  { id: 'settings', path: 'settings/profile', label: 'Settings', icon: 'settings' },
];

const staffNavItems: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: 'dashboard' },
  { id: 'clients', label: 'Clients', icon: 'group' },
  { id: 'appointments', label: 'Appointments', icon: 'event' },
  { id: 'quotations', label: 'Quotations', icon: 'description' },
  // No 'tasks' entry: there is no Tasks feature in this codebase — no route,
  // page, Prisma model or endpoint. The link was a leftover from early planning
  // and sent staff to a 404.
  // settings/profile carries no RoleGuard, so every staff member can reach
  // their own profile — previously this link only appeared for staff who
  // happened to manage a warehouse.
  { id: 'settings', path: 'settings/profile', label: 'Settings', icon: 'settings' },
];

/**
 * Platform administration, not a business's workspace.
 *
 * SUPER_ADMIN used to fall through to `ownerNavItems` — the hook branched only
 * on `role === 'STAFF'`, so every other role silently inherited the owner list.
 * That gave the platform console links to Clients, Appointments, Inventory,
 * Quotations, Reports and Settings: six dead ends, because Phase A established
 * that SUPER_ADMIN gets **zero** access to any individual tenant's business
 * data, and `resolveTenant` enforces exactly that with a 403.
 *
 * So this is not a routing fix. The links were correct to fail; the list was
 * wrong. It now contains only what a platform-level role can actually reach.
 * TD-008.
 */
const superAdminNavItems: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: 'dashboard' },
  // `domain` (Building) rather than a new name: Sidebar's iconMap falls back to
  // the dashboard icon for anything it does not know, so an unmapped name would
  // silently give two identical icons instead of an error.
  { id: 'tenants', label: 'Tenants', icon: 'domain' },
];

/** Stock management is the one item legitimately gated on the staff warehouse. */
const staffWarehouseNavItem: NavItem = {
  id: 'inventory',
  label: 'Products & Stock',
  icon: 'inventory_2',
};

export const useNavigation = (user?: any | null, currentPath?: string) => {
  const role = user?.role;

  // Every branch copies. Returning the module-level array by reference meant a
  // future push on one path would permanently mutate the shared list for every
  // screen in the app.
  //
  // SUPER_ADMIN is matched explicitly rather than being left to fall through:
  // "not STAFF" was never a sound definition of "business owner". See TD-008.
  const baseItems: NavItem[] =
    role === 'STAFF'
      ? [...staffNavItems]
      : role === 'SUPER_ADMIN'
        ? [...superAdminNavItems]
        : [...ownerNavItems];

  if (role === 'STAFF' && user?.warehouseId) {
    baseItems.push(staffWarehouseNavItem);
  }

  /*
   * Dashboard doubles as the fallback highlight when the path matches nothing
   * else. That used to be spelled as a hand-maintained exclusion list
   * (`!includes('/clients') && !includes('/settings') && ...`) which named only
   * three of the seven destinations — so on /inventory or /quotations the
   * sidebar lit up Dashboard as well as the real page.
   *
   * Deriving the exclusions from the item list itself cannot fall behind it,
   * and it is what lets the new Tenants entry work without another manual edit.
   */
  const matchesPath = (id: string) => currentPath?.includes(`/${id}`) ?? false;
  const anotherItemMatches = baseItems.some(item => item.id !== 'dashboard' && matchesPath(item.id));

  return baseItems.map(item => ({
    ...item,
    isActive:
      matchesPath(item.id) ||
      (item.id === 'dashboard' &&
        currentPath?.endsWith('/login') === false &&
        !anotherItemMatches),
  }));
};
