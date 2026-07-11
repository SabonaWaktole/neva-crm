import React, { ReactNode } from 'react';
import { Card } from '../../ui/Card/Card';
import styles from './AuthLayout.module.css';

export interface AuthLayoutProps {
  children: ReactNode;
  title: string;
  subtitle?: string;
  logoSrc?: string;
  logoIcon?: ReactNode; // Alternative if no src is provided
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({
  children,
  title,
  subtitle,
  logoSrc,
  logoIcon,
}) => {
  return (
    <div className={styles.container}>
      <Card padding="xl" className={styles.mainCard}>
        <header className={styles.header}>
          {(logoSrc || logoIcon) && (
            <div className={styles.logoWrapper}>
              {logoSrc ? (
                <img src={logoSrc} alt="Logo" className={styles.logoImage} />
              ) : (
                logoIcon
              )}
            </div>
          )}
          <div className={styles.titleWrapper}>
            <h1 className={styles.title}>{title}</h1>
            {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
          </div>
        </header>
        
        {children}
      </Card>
    </div>
  );
};
