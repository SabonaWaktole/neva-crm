import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import styles from './MultiLocationStockIndicator.module.css';

export interface StockBreakdown {
  warehouseName: string;
  quantity: number;
}

export interface MultiLocationStockIndicatorProps {
  totalUnits: number;
  breakdown?: StockBreakdown[];
  className?: string;
}

export const MultiLocationStockIndicator: React.FC<MultiLocationStockIndicatorProps> = ({
  totalUnits,
  breakdown = [],
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const hasBreakdown = breakdown.length > 0;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Hover disabled for touch/keyboard accessibility; relies strictly on click toggle.

  const handleClick = () => {
    if (hasBreakdown) {
      setIsOpen((prev) => !prev);
    }
  };

  const triggerClasses = [
    styles.trigger,
    !hasBreakdown ? styles.triggerNoCursor : ''
  ].filter(Boolean).join(' ');

  return (
    <div 
      className={`${styles.container} ${className}`.trim()}
      ref={containerRef}
    >
      <div 
        className={triggerClasses}
        onClick={handleClick}
        role={hasBreakdown ? 'button' : 'presentation'}
        tabIndex={hasBreakdown ? 0 : undefined}
        onKeyDown={(e) => {
          if (hasBreakdown && (e.key === 'Enter' || e.key === ' ')) {
            e.preventDefault();
            setIsOpen((prev) => !prev);
          }
        }}
      >
        <span>{totalUnits} Units</span>
        {hasBreakdown && (
          <ChevronDown size={16} />
        )}
      </div>

      {isOpen && hasBreakdown && (
        <div className={styles.popover}>
          {breakdown.map((item, index) => (
            <div key={`${item.warehouseName}-${index}`} className={styles.popoverItem}>
              <span className={styles.warehouseName}>{item.warehouseName}</span>
              <span className={styles.quantity}>{item.quantity}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
