import React, { ReactNode } from 'react';
import { Avatar } from '../../ui/Avatar/Avatar';
import styles from './AppLayout.module.css';

export interface AppLayoutProps {
  children: ReactNode;
  sidebar?: ReactNode;
  userAvatarSrc?: string;
  userName?: string;
  logoText?: string;
}

export const AppLayout: React.FC<AppLayoutProps> = ({
  children,
  sidebar,
  userAvatarSrc,
  userName = 'User',
  logoText = 'Nexus CRM',
}) => {
  return (
    <div className={styles.layout}>
      {/* Top App Bar */}
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <span className={styles.logoText}>{logoText}</span>
        </div>
        
        <div className={styles.headerCenter}>
          <span className={`material-symbols-outlined ${styles.searchIcon}`}>search</span>
          <input 
            type="text" 
            placeholder="Search..." 
            className={styles.searchInput}
          />
        </div>
        
        <div className={styles.headerRight}>
          <button className={styles.iconBtn} aria-label="Notifications">
            <span className="material-symbols-outlined">notifications</span>
          </button>
          <button className={styles.iconBtn} aria-label="Help">
            <span className="material-symbols-outlined">help</span>
          </button>
          <button className={styles.profileBtn} aria-label="User Profile">
            <Avatar 
              src={userAvatarSrc} 
              fallback={userName.charAt(0).toUpperCase()} 
              size="sm" 
              alt={`${userName}'s profile`} 
            />
          </button>
        </div>
      </header>

      <div className={styles.contentArea}>
        {/* Sidebar injected here */}
        {sidebar}
        
        {/* Main Content Area */}
        <main className={styles.mainContent}>
          {children}
        </main>
      </div>
    </div>
  );
};
