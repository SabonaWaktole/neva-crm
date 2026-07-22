import React, { useState, useRef, useEffect } from 'react';
import type { ReactNode } from 'react';
import { Search, Bell, HelpCircle, Settings, LogOut } from 'lucide-react';
import { Avatar } from '../../ui/Avatar/Avatar';
import styles from './AppLayout.module.css';

export interface AppLayoutProps {
  children: ReactNode;
  sidebar?: ReactNode;
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
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className={styles.layout}>
      {/* Top App Bar */}
      <header className={styles.header}>
        <div className={styles.headerLeft}>
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
          <button className={styles.iconBtn} aria-label="Notifications">
            <Bell size={20} />
          </button>
          <button className={styles.iconBtn} aria-label="Help">
            <HelpCircle size={20} />
          </button>
          <div style={{ position: 'relative' }} ref={dropdownRef}>
            <button 
              className={styles.profileBtn} 
              aria-label="User Profile"
              onClick={() => setShowDropdown(!showDropdown)}
            >
              <Avatar 
                src={userAvatarSrc} 
                fallback={userName.charAt(0).toUpperCase()} 
                size="sm" 
                alt={`${userName}'s profile`} 
              />
            </button>
            {showDropdown && (
              <div style={{
                position: 'absolute',
                top: '100%',
                right: 0,
                marginTop: '4px',
                backgroundColor: 'var(--color-surface-container-lowest)',
                border: '1px solid var(--color-outline-variant)',
                borderRadius: 'var(--radius-default)',
                boxShadow: 'var(--elevation-2)',
                minWidth: '180px',
                zIndex: 100,
                overflow: 'hidden',
              }}>
                <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--color-outline-variant)' }}>
                  <p style={{ margin: 0, fontFamily: 'var(--font-family-base)', fontSize: 'var(--font-size-label-md)', fontWeight: 600, color: 'var(--color-on-surface)' }}>{userName}</p>
                </div>
                {onSettingsClick && (
                  <button
                    onClick={() => { setShowDropdown(false); onSettingsClick(); }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '8px', width: '100%', padding: '10px 16px',
                      border: 'none', background: 'none', cursor: 'pointer',
                      fontFamily: 'var(--font-family-base)', fontSize: 'var(--font-size-body-md)', color: 'var(--color-on-surface)',
                    }}
                  >
                    <Settings size={18} />
                    Settings
                  </button>
                )}
                {onLogout && (
                  <button
                    onClick={() => { setShowDropdown(false); onLogout(); }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '8px', width: '100%', padding: '10px 16px',
                      border: 'none', background: 'none', cursor: 'pointer',
                      fontFamily: 'var(--font-family-base)', fontSize: 'var(--font-size-body-md)', color: 'var(--color-error)',
                    }}
                  >
                    <LogOut size={18} />
                    Log Out
                  </button>
                )}
              </div>
            )}
          </div>
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
