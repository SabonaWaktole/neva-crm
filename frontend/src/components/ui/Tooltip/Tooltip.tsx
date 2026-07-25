import React, { useId, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import styles from './Tooltip.module.css';

export interface TooltipProps {
  content: ReactNode;
  children: React.ReactElement<{ 'aria-describedby'?: string }>;
  side?: 'top' | 'bottom' | 'left' | 'right';
  delayMs?: number;
}

export const Tooltip: React.FC<TooltipProps> = ({
  content,
  children,
  side = 'top',
  delayMs = 300,
}) => {
  const [visible, setVisible] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const id = useId();

  const show = () => {
    timeoutRef.current = setTimeout(() => setVisible(true), delayMs);
  };

  const hide = () => {
    clearTimeout(timeoutRef.current);
    setVisible(false);
  };

  return (
    <span
      className={styles.wrapper}
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={hide}
    >
      {React.cloneElement(children, { 'aria-describedby': visible ? id : undefined })}
      {visible && (
        <span role="tooltip" id={id} className={`${styles.tooltip} ${styles[side]}`}>
          {content}
        </span>
      )}
    </span>
  );
};
