import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import styles from './SlideOver.module.css';

export interface SlideOverProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export const SlideOver: React.FC<SlideOverProps> = ({
  isOpen,
  onClose,
  title,
  children,
  footer,
}) => {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  const wrapperClasses = [styles.wrapper, isOpen ? styles.wrapperOpen : ''].filter(Boolean).join(' ');

  return (
    <div className={wrapperClasses}>
      <div className={styles.backdrop} onClick={onClose} aria-hidden="true" />
      <div 
        className={styles.panel} 
        role="dialog" 
        aria-modal="true" 
        aria-labelledby="slideover-title"
      >
        <div className={styles.header}>
          <h2 id="slideover-title" className={styles.title}>{title}</h2>
          <button 
            className={styles.closeButton} 
            onClick={onClose} 
            aria-label="Close panel"
          >
            <X size={20} />
          </button>
        </div>
        <div className={styles.body}>
          {children}
        </div>
        {footer && (
          <div className={styles.footer}>
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};
