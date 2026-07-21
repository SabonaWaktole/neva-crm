import type { Role } from '../store/useAuthStore';
import type { NavItem } from '../components/layout/Sidebar/Sidebar';

const ownerNavItems: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: 'dashboard' },
  { id: 'clients', label: 'Clients', icon: 'group' },
  { id: 'appointments', label: 'Appointments', icon: 'event' },
  { id: 'inventory', label: 'Products & Stock', icon: 'inventory_2' },
  { id: 'quotations', label: 'Quotations', icon: 'description' },
  { id: 'reports', label: 'Reports', icon: 'bar_chart' },
  { id: 'settings', label: 'Settings', icon: 'settings' },
];

const staffNavItems: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: 'dashboard' },
  { id: 'clients', label: 'Clients', icon: 'group' },
  { id: 'appointments', label: 'Appointments', icon: 'event' },
  { id: 'quotations', label: 'Quotations', icon: 'description' },
  { id: 'tasks', label: 'My Tasks', icon: 'task_alt' },
];

export const useNavigation = (role?: Role | null, currentPath?: string) => {
  const baseItems = role === 'STAFF' ? staffNavItems : ownerNavItems;
  
  return baseItems.map(item => ({
    ...item,
    isActive: currentPath?.includes(`/${item.id}`) || (item.id === 'dashboard' && (currentPath?.endsWith('/login') === false && !currentPath?.includes('/clients') && !currentPath?.includes('/settings') && !currentPath?.includes('/appointments')))
  }));
};
