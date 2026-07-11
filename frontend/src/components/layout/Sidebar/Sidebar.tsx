import React from 'react';
import {
  LayoutDashboard, Users, Calendar, Package, FileText, BarChart3,
  Settings, Building, CreditCard, Search, ClipboardCheck, Plus,
  HelpCircle, LogOut,
  type LucideIcon,
} from 'lucide-react';
import { Button } from '../../ui/Button/Button';
import styles from './Sidebar.module.css';

// Map material-symbols icon names to Lucide components
const iconMap: Record<string, LucideIcon> = {
  dashboard: LayoutDashboard,
  group: Users,
  event: Calendar,
  inventory_2: Package,
  description: FileText,
  bar_chart: BarChart3,
  settings: Settings,
  settings_applications: Settings,
  domain: Building,
  credit_card: CreditCard,
  manage_search: Search,
  task_alt: ClipboardCheck,
};

export interface NavItem {
  id: string;
  label: string;
  icon: string;
  isActive?: boolean;
}

export interface SidebarProps {
  orgName: string;
  orgTier?: string;
  navItems: NavItem[];
  onNavItemClick?: (id: string) => void;
  onNewEntryClick?: () => void;
  onLogoutClick?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  orgName,
  orgTier = 'Standard Tier',
  navItems,
  onNavItemClick,
  onNewEntryClick,
  onLogoutClick,
}) => {
  return (
    <nav className={styles.sidebar}>
      <div className={styles.orgSection}>
        <div className={styles.orgIcon}>
          <Building size={20} />
        </div>
        <div className={styles.orgInfo}>
          <h2 className={styles.orgName}>{orgName}</h2>
          <p className={styles.orgTier}>{orgTier}</p>
        </div>
      </div>

      <div className={styles.actionSection}>
        <Button 
          variant="primary" 
          fullWidth 
          icon={<Plus size={18} />}
          onClick={onNewEntryClick}
        >
          New Entry
        </Button>
      </div>

      <div className={styles.navSection}>
        {navItems.map((item) => {
          const IconComponent = iconMap[item.icon] || LayoutDashboard;
          return (
            <a
              key={item.id}
              className={`${styles.navItem} ${item.isActive ? styles.navItemActive : ''}`}
              onClick={(e) => {
                e.preventDefault();
                if (onNavItemClick) onNavItemClick(item.id);
              }}
              href={`#${item.id}`}
            >
              <IconComponent className={styles.navIcon} size={20} />
              <span className={styles.navLabel}>{item.label}</span>
            </a>
          );
        })}
      </div>

      <div className={styles.bottomSection}>
        <a 
          className={styles.navItem} 
          href="#support"
          onClick={(e) => e.preventDefault()}
        >
          <HelpCircle className={styles.navIcon} size={20} />
          <span className={styles.navLabel}>Support</span>
        </a>
        <a 
          className={`${styles.navItem} ${styles.logoutItem}`} 
          href="#logout"
          onClick={(e) => {
            e.preventDefault();
            if (onLogoutClick) onLogoutClick();
          }}
        >
          <LogOut className={styles.navIcon} size={20} />
          <span className={styles.navLabel}>Log Out</span>
        </a>
      </div>
    </nav>
  );
};
