import React from 'react';
import type { ReactNode } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuthStore } from '../../../store/useAuthStore';
import { User, Building2, Sliders, UsersRound, Puzzle, PackageOpen, FolderTree } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import styles from './SettingsLayout.module.css';

export interface SettingsLayoutProps {
  children: ReactNode;
  activeNavId: string;
}

interface NavItem {
  id: string;
  label: string;
  icon: LucideIcon;
}

const navItems: NavItem[] = [
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'company', label: 'Company', icon: Building2 },
  { id: 'client-management', label: 'Client Management', icon: Sliders },
  { id: 'team', label: 'Team', icon: UsersRound },
  { id: 'integrations', label: 'Integrations', icon: Puzzle },
  { id: 'warehouses', label: 'Warehouses', icon: PackageOpen },
  { id: 'categories', label: 'Categories', icon: FolderTree },
];

export const SettingsLayout: React.FC<SettingsLayoutProps> = ({
  children,
  activeNavId,
}) => {
  const { tenantSlug } = useParams();
  const { user } = useAuthStore();
  const isStaff = user?.role === 'STAFF';
  
  return (
    <div className={styles.layout}>
      {/* Left Sidebar for Settings (tablet and up) */}
      {!isStaff && (
        <aside className={styles.sidebar}>
          <h2 className={styles.title}>Settings</h2>
          <nav className={styles.nav}>
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeNavId === item.id;
              const itemClasses = [
                styles.navItem,
                isActive ? styles.navItemActive : ''
              ].filter(Boolean).join(' ');

              return (
                <Link
                  key={item.id}
                  to={`/${tenantSlug}/settings${item.id === 'company' ? '' : `/${item.id}`}`}
                  className={itemClasses}
                >
                  <Icon className={styles.navIcon} size={20} />
                  <span className={styles.navLabel}>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </aside>
      )}

      {/* Horizontal scrollable tab bar (mobile only) */}
      {!isStaff && (
        <nav className={styles.mobileNav}>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeNavId === item.id;
            const itemClasses = [
              styles.mobileNavItem,
              isActive ? styles.mobileNavItemActive : ''
            ].filter(Boolean).join(' ');

            return (
              <Link
                key={item.id}
                to={`/${tenantSlug}/settings${item.id === 'company' ? '' : `/${item.id}`}`}
                className={itemClasses}
              >
                <Icon size={16} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      )}

      {/* Right Content Area */}
      <main className={styles.content}>
        {children}
      </main>
    </div>
  );
};
