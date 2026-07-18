import { forwardRef } from 'react';
import type { HTMLAttributes, ReactNode } from 'react';
import styles from './Card.module.css';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  glass?: boolean;
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ children, padding = 'xl', glass = false, className = '', ...props }, ref) => {
    const classNames = [
      styles.card,
      styles[`padding-${padding}`],
      glass ? styles.glass : '',
      className,
    ]
      .filter(Boolean)
      .join(' ');

    return (
      <div ref={ref} className={classNames} {...props}>
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';
