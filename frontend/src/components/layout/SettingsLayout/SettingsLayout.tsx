import React from 'react';
import type { ReactNode } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../../store/useAuthStore';
import { User, Building2, Sliders, UsersRound, Puzzle, PackageOpen, FolderTree, Bell } from 'lucide-react';
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

export const SettingsLayout: React.FC<SettingsLayoutProps> = ({
  children,
  activeNavId,
}) => {
  const { tenantSlug } = useParams();
  const { user } = useAuthStore();
  const { t } = useTranslation('settings');
  const isStaff = user?.role === 'STAFF';

  const navItems: NavItem[] = [
    { id: 'profile', label: t('nav.profile'), icon: User },
    { id: 'company', label: t('nav.company'), icon: Building2 },
    { id: 'client-management', label: t('nav.clientManagement'), icon: Sliders },
    // Next to Company because it is workspace-wide policy, not a personal
    // preference — the page itself is Business Owner-only for the same reason.
    { id: 'notifications', label: t('nav.notifications'), icon: Bell },
    { id: 'team', label: t('nav.team'), icon: UsersRound },
    { id: 'integrations', label: t('nav.integrations'), icon: Puzzle },
    { id: 'warehouses', label: t('nav.warehouses'), icon: PackageOpen },
    { id: 'categories', label: t('nav.categories'), icon: FolderTree },
  ];

  return (
    <div className={styles.layout}>
      {/* Left Sidebar for Settings (tablet and up) */}
      {!isStaff && (
        <aside className={styles.sidebar}>
          <h2 className={styles.title}>{t('nav.title')}</h2>
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
