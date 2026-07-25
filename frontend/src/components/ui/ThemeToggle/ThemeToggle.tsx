import React from 'react';
import { Monitor, Moon, Sun } from 'lucide-react';
import { useThemeStore } from '../../../store/useThemeStore';
import type { ThemePreference } from '../../../store/useThemeStore';
import { DropdownMenu } from '../DropdownMenu/DropdownMenu';
import type { DropdownMenuItemType } from '../DropdownMenu/DropdownMenu';
import styles from './ThemeToggle.module.css';

const OPTIONS: { id: ThemePreference; label: string; icon: React.ReactNode }[] = [
  { id: 'light', label: 'Light', icon: <Sun size={16} /> },
  { id: 'dark', label: 'Dark', icon: <Moon size={16} /> },
  { id: 'system', label: 'System', icon: <Monitor size={16} /> },
];

export interface ThemeToggleProps {
  /** Extra class for the trigger button, so layouts can match their icon buttons. */
  className?: string;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ className = '' }) => {
  const preference = useThemeStore((state) => state.preference);
  const resolved = useThemeStore((state) => state.resolved);
  const setPreference = useThemeStore((state) => state.setPreference);

  const activeOption = OPTIONS.find((option) => option.id === preference) ?? OPTIONS[2];

  const items: DropdownMenuItemType[] = OPTIONS.map((option) => ({
    id: option.id,
    label: option.id === preference ? `${option.label} ✓` : option.label,
    icon: option.icon,
    onClick: () => setPreference(option.id),
  }));

  return (
    <DropdownMenu
      align="right"
      header="Theme"
      items={items}
      trigger={
        <button
          type="button"
          className={`${styles.trigger} ${className}`}
          aria-label={`Theme: ${activeOption.label}. Change theme`}
        >
          {/* Show what is actually rendered, not the preference, so "system" reads correctly. */}
          {resolved === 'dark' ? <Moon size={20} /> : <Sun size={20} />}
        </button>
      }
    />
  );
};
