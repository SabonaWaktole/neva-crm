import React from 'react';
import styles from './KPICard.module.css';
import { Card } from '../Card/Card';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

export interface KPICardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  iconColor?: string;
  iconBgColor?: string;
  trendValue?: string;
  trendLabel?: string;
  trendDirection?: 'up' | 'down' | 'neutral';
  isPlaceholder?: boolean;
  placeholderText?: string;
}

export const KPICard: React.FC<KPICardProps> = ({
  title,
  value,
  icon,
  iconColor = 'var(--color-primary)',
  iconBgColor = 'var(--color-primary-container)',
  trendValue,
  trendLabel,
  trendDirection = 'neutral',
  isPlaceholder = false,
  placeholderText = 'Coming soon',
}) => {
  return (
    <div className={`${styles.wrapper} ${isPlaceholder ? styles.placeholder : ''}`}>
      <Card className={styles.card}>
        <div className={styles.header}>
          <h3 className={styles.title}>{title}</h3>
          <div 
            className={styles.iconWrapper} 
            style={{ color: iconColor, backgroundColor: iconBgColor }}
          >
            {icon}
          </div>
        </div>
        
        <div className={styles.content}>
          <div className={styles.value}>
            {isPlaceholder ? '---' : value}
          </div>
          
          {(trendValue || isPlaceholder) && (
            <div className={styles.trendContainer}>
              {isPlaceholder ? (
                <div className={`${styles.trendBadge} ${styles.trendNeutral}`}>
                  <Minus size={14} />
                  <span>{placeholderText}</span>
                </div>
              ) : (
                <div className={`
                  ${styles.trendBadge} 
                  ${trendDirection === 'up' ? styles.trendUp : ''}
                  ${trendDirection === 'down' ? styles.trendDown : ''}
                  ${trendDirection === 'neutral' ? styles.trendNeutral : ''}
                `}>
                  {trendDirection === 'up' && <TrendingUp size={14} />}
                  {trendDirection === 'down' && <TrendingDown size={14} />}
                  {trendDirection === 'neutral' && <Minus size={14} />}
                  <span>{trendValue}</span>
                </div>
              )}
              {!isPlaceholder && trendLabel && (
                <span className={styles.trendLabel}>{trendLabel}</span>
              )}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};
