import React from 'react';
import { Button } from '../../ui/Button/Button';
import styles from './Sidebar.module.css';

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
          <span className="material-symbols-outlined">apartment</span>
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
          icon={<span className="material-symbols-outlined">add</span>}
          onClick={onNewEntryClick}
        >
          New Entry
        </Button>
      </div>

      <div className={styles.navSection}>
        {navItems.map((item) => (
          <a
            key={item.id}
            className={`${styles.navItem} ${item.isActive ? styles.navItemActive : ''}`}
            onClick={(e) => {
              e.preventDefault();
              if (onNavItemClick) onNavItemClick(item.id);
            }}
            href={`#${item.id}`}
          >
            <span className={`material-symbols-outlined ${styles.navIcon}`}>{item.icon}</span>
            <span className={styles.navLabel}>{item.label}</span>
          </a>
        ))}
      </div>

      <div className={styles.bottomSection}>
        <a 
          className={styles.navItem} 
          href="#support"
          onClick={(e) => e.preventDefault()}
        >
          <span className={`material-symbols-outlined ${styles.navIcon}`}>contact_support</span>
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
          <span className={`material-symbols-outlined ${styles.navIcon}`}>logout</span>
          <span className={styles.navLabel}>Log Out</span>
        </a>
      </div>
    </nav>
  );
};
