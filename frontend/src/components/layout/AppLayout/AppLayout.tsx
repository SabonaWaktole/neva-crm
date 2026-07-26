import React, { useState } from 'react';
import type { ReactNode, ReactElement } from 'react';
import { Search, Bell, HelpCircle, Settings, LogOut, Menu, X } from 'lucide-react';
import { Avatar } from '../../ui/Avatar/Avatar';
import { ThemeToggle } from '../../ui/ThemeToggle';
import { DropdownMenu } from '../../ui/DropdownMenu/DropdownMenu';
import type { DropdownMenuItemType } from '../../ui/DropdownMenu/DropdownMenu';
import { useAuthStore } from '../../../store/useAuthStore';
import { resolveMediaUrl, srcSetFor } from '../../../services/mediaService';
import styles from './AppLayout.module.css';

export interface AppLayoutProps {
  children: ReactNode;
  sidebar?: ReactElement<any>; // Changed to ReactElement to clone
  userAvatarSrc?: string;
  userName?: string;
  logoText?: string;
  onLogout?: () => void;
  onSettingsClick?: () => void;
}

export const AppLayout: React.FC<AppLayoutProps> = ({
  children,
  sidebar,
  userAvatarSrc,
  userName = 'User',
  logoText = 'Neva CRM',
  onLogout,
  onSettingsClick,
}) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);

  // The header avatar comes from the signed-in user unless a caller passes an
  // explicit override. Reading it here rather than in each page means the
  // photo updates everywhere the moment it is changed in settings — and it is
  // why no page needs to pass `userAvatarSrc` at all.
  const currentUser = useAuthStore((state) => state.user);
  const avatarSrc = userAvatarSrc ?? resolveMediaUrl(currentUser?.avatarUrl);
  const avatarSrcSet = userAvatarSrc ? undefined : srcSetFor(currentUser?.avatarUrl);

  const profileItems: DropdownMenuItemType[] = [
    ...(onSettingsClick
      ? [{ id: 'settings', label: 'Settings', icon: <Settings size={18} />, onClick: onSettingsClick }]
      : []),
    ...(onLogout
      ? [{ id: 'logout', label: 'Log Out', icon: <LogOut size={18} />, onClick: onLogout, danger: true }]
      : []),
  ];

  return (
    <div className={styles.layout}>
      {/* Top App Bar */}
      <header className={`${styles.header} glass`}>
        <div className={styles.headerLeft}>
          <button 
            className={`${styles.iconBtn} ${styles.menuBtn}`} 
            onClick={() => setIsSidebarOpen(true)}
            aria-label="Open menu"
          >
            <Menu size={24} />
          </button>
          <span className={styles.logoText}>{logoText}</span>
        </div>
        
        <div className={styles.headerCenter}>
          <Search className={styles.searchIcon} size={18} />
          <input
            type="text"
            placeholder="Search..."
            className={styles.searchInput}
          />
        </div>

        <div className={styles.headerRight}>
          <button
            className={`${styles.iconBtn} ${styles.mobileSearchBtn}`}
            aria-label="Search"
            onClick={() => setIsMobileSearchOpen((prev) => !prev)}
          >
            {isMobileSearchOpen ? <X size={20} /> : <Search size={20} />}
          </button>
          <ThemeToggle className={styles.iconBtn} />
          <button className={styles.iconBtn} aria-label="Notifications">
            <Bell size={20} />
          </button>
          <button className={`${styles.iconBtn} ${styles.helpBtn}`} aria-label="Help">
            <HelpCircle size={20} />
          </button>
          <DropdownMenu
            align="right"
            trigger={
              <button className={styles.profileBtn} aria-label="User Profile">
                <Avatar
                  src={avatarSrc}
                  srcSet={avatarSrcSet}
                  fallback={userName.charAt(0).toUpperCase()}
                  size="sm"
                  alt={`${userName}'s profile`}
                />
              </button>
            }
            items={profileItems}
            header={userName}
          />
        </div>
      </header>

      {isMobileSearchOpen && (
        <div className={styles.mobileSearchBar}>
          <Search className={styles.searchIcon} size={18} />
          <input
            type="text"
            placeholder="Search..."
            className={styles.searchInput}
            autoFocus
          />
        </div>
      )}

      <div className={styles.contentArea}>
        {/* Sidebar injected here */}
        {sidebar && React.cloneElement(sidebar, {
          isOpen: isSidebarOpen,
          onClose: () => setIsSidebarOpen(false)
        })}
        
        {/* Main Content Area */}
        <main className={styles.mainContent}>
          {children}
        </main>
      </div>
    </div>
  );
};
