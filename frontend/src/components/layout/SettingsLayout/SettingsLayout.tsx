import React from 'react';
import type { ReactNode } from 'react';
import { User, Building2, Sliders, UsersRound, Puzzle } from 'lucide-react';
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
];

export const SettingsLayout: React.FC<SettingsLayoutProps> = ({
  children,
  activeNavId,
}) => {
  return (
    <div className={styles.layout}>
      {/* Left Sidebar for Settings */}
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
              <a
                key={item.id}
                href={`#${item.id}`} // Using hash for navigation, could be replaced with Link depending on routing
                className={itemClasses}
              >
                <Icon className={styles.navIcon} size={20} />
                <span className={styles.navLabel}>{item.label}</span>
              </a>
            );
          })}
        </nav>
      </aside>

      {/* Right Content Area */}
      <main className={styles.content}>
        {children}
      </main>
    </div>
  );
};
