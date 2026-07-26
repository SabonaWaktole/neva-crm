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

/** Stock management is the one item legitimately gated on the staff warehouse. */
const staffWarehouseNavItem: NavItem = {
  id: 'inventory',
  label: 'Products & Stock',
  icon: 'inventory_2',
};

export const useNavigation = (user?: any | null, currentPath?: string) => {
  const role = user?.role;

  // Both branches copy. Returning the module-level array by reference meant a
  // future push on the non-STAFF path would permanently mutate the shared list
  // for every screen in the app.
  const baseItems: NavItem[] = role === 'STAFF' ? [...staffNavItems] : [...ownerNavItems];

  if (role === 'STAFF' && user?.warehouseId) {
    baseItems.push(staffWarehouseNavItem);
  }

  return baseItems.map(item => ({
    ...item,
    isActive: currentPath?.includes(`/${item.id}`) || (item.id === 'dashboard' && (currentPath?.endsWith('/login') === false && !currentPath?.includes('/clients') && !currentPath?.includes('/settings') && !currentPath?.includes('/appointments')))
  }));
};
