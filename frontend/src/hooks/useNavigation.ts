import type { NavItem } from '../components/layout/Sidebar/Sidebar';

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
  { id: 'tasks', label: 'My Tasks', icon: 'task_alt' },
];

export const useNavigation = (user?: any | null, currentPath?: string) => {
  const role = user?.role;
  let baseItems = role === 'STAFF' ? [...staffNavItems] : ownerNavItems;
  
  if (role === 'STAFF' && user?.warehouseId) {
    baseItems.push({ id: 'inventory', label: 'Products & Stock', icon: 'inventory_2' });
    baseItems.push({ id: 'reports', label: 'Reports', icon: 'bar_chart' });
    baseItems.push({ id: 'settings', path: 'settings/profile', label: 'Settings', icon: 'settings' });
  }
  
  return baseItems.map(item => ({
    ...item,
    isActive: currentPath?.includes(`/${item.id}`) || (item.id === 'dashboard' && (currentPath?.endsWith('/login') === false && !currentPath?.includes('/clients') && !currentPath?.includes('/settings') && !currentPath?.includes('/appointments')))
  }));
};
