import React, { ButtonHTMLAttributes, ReactNode } from 'react';
import { Loader2 } from 'lucide-react';
import styles from './Button.module.css';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: 'primary' | 'outline';
  fullWidth?: boolean;
  icon?: ReactNode;
  iconPosition?: 'left' | 'right';
  isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  fullWidth = false,
  icon,
  iconPosition = 'left',
  className = '',
  isLoading = false,
  ...props
}) => {
  const classNames = [
    styles.button,
    styles[variant],
    fullWidth ? styles.fullWidth : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button className={classNames} disabled={isLoading || props.disabled} {...props}>
      {isLoading ? (
        <>
          <Loader2 size={18} style={{ animation: 'spin 1s linear infinite', marginRight: '8px' }} />
          Loading...
        </>
      ) : (
        <>
          {icon && iconPosition === 'left' && <span className={styles.icon}>{icon}</span>}
          {children}
          {icon && iconPosition === 'right' && <span className={styles.icon}>{icon}</span>}
        </>
      )}
    </button>
  );
};
