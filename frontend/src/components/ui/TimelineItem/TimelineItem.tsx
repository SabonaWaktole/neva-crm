import { forwardRef } from 'react';
import type { ReactNode } from 'react';
import styles from './TimelineItem.module.css';

export interface TimelineItemProps {
  title: string;
  subtitle?: string;
  content?: ReactNode;
  icon?: ReactNode;
  iconBgColor?: string;
  iconTextColor?: string;
  statusLabel?: string;
  statusColor?: string;
  statusBgColor?: string;
  isLast?: boolean;
  className?: string;
}

export const TimelineItem = forwardRef<HTMLDivElement, TimelineItemProps>(
  (
    {
      title,
      subtitle,
      content,
      icon,
      iconBgColor,
      iconTextColor,
      statusLabel,
      statusColor,
      statusBgColor,
      isLast = false,
      className = '',
      ...props
    },
    ref
  ) => {
    const containerClasses = [
      styles.timelineItem,
      isLast ? styles.lastItem : '',
      className,
    ]
      .filter(Boolean)
      .join(' ');

    return (
      <div ref={ref} className={containerClasses} {...props}>
        {!isLast && <div className={styles.timelineLine} />}

        <div
          className={styles.iconCircle}
          style={{
            backgroundColor: iconBgColor,
            color: iconTextColor,
          }}
        >
          {icon}
        </div>

        <div className={styles.contentCard}>
          <div className={styles.header}>
            <div className={styles.titleRow}>
              <span className={styles.title}>{title}</span>
              {statusLabel && (
                <span
                  className={styles.statusBadge}
                  style={{
                    backgroundColor: statusBgColor,
                    color: statusColor,
                  }}
                >
                  {statusLabel}
                </span>
              )}
            </div>
            <div className={styles.subtitle}>{subtitle}</div>
          </div>
          <div className={styles.content}>{content}</div>
        </div>
      </div>
    );
  }
);

TimelineItem.displayName = 'TimelineItem';
