import React, { useState, useRef, useEffect } from 'react';
import type { ReactNode } from 'react';
import styles from './DropdownMenu.module.css';

export interface DropdownMenuItemType {
  id: string;
  label: string;
  icon?: ReactNode;
  onClick: () => void;
  danger?: boolean;
}

export interface DropdownMenuProps {
  trigger: ReactNode;
  items: DropdownMenuItemType[];
  align?: 'left' | 'right';
  className?: string;
}

export const DropdownMenu: React.FC<DropdownMenuProps> = ({
  trigger,
  items,
  align = 'right',
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [isOpen]);

  const handleToggle = () => setIsOpen((prev) => !prev);

  const handleItemClick = (item: DropdownMenuItemType) => {
    item.onClick();
    setIsOpen(false);
  };

  const dropdownClasses = [
    styles.dropdown,
    align === 'right' ? styles.alignRight : styles.alignLeft
  ].join(' ');

  return (
    <div className={`${styles.container} ${className}`.trim()} ref={containerRef}>
      <div className={styles.triggerWrapper} onClick={handleToggle}>
        {trigger}
      </div>
      {isOpen && (
        <div className={dropdownClasses}>
          {items.map((item) => (
            <button
              key={item.id}
              className={[
                styles.item,
                item.danger ? styles.itemDanger : ''
              ].filter(Boolean).join(' ')}
              onClick={() => handleItemClick(item)}
            >
              {item.icon && <span className={styles.itemIcon}>{item.icon}</span>}
              <span>{item.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
