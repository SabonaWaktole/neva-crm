import { createContext, useContext } from 'react';

export type ToastVariant = 'success' | 'error' | 'warning' | 'info';

export interface ToastOptions {
  /** Optional bold line above the message. */
  title?: string;
  /** Milliseconds before auto-dismiss. Pass 0 to require a manual dismiss. */
  duration?: number;
  /** A single inline action, e.g. "Undo". Dismisses the toast when pressed. */
  action?: { label: string; onClick: () => void };
}

export interface ToastContextValue {
  success: (message: string, options?: ToastOptions) => void;
  error: (message: string, options?: ToastOptions) => void;
  warning: (message: string, options?: ToastOptions) => void;
  info: (message: string, options?: ToastOptions) => void;
  dismiss: (id: number) => void;
}

/**
 * Kept apart from the provider component so the module holding the hook
 * exports no components — otherwise React Fast Refresh cannot hot-reload the
 * provider without remounting the tree.
 */
export const ToastContext = createContext<ToastContextValue | null>(null);

export const useToast = (): ToastContextValue => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used inside a <ToastProvider>.');
  }
  return context;
};
