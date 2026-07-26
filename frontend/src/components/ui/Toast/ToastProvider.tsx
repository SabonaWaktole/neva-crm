import React, { useCallback, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle, CheckCircle2, Info, X, XCircle } from 'lucide-react';
import { ToastContext } from './toastContext';
import type { ToastContextValue, ToastOptions, ToastVariant } from './toastContext';
import styles from './Toast.module.css';

interface Toast extends ToastOptions {
  id: number;
  variant: ToastVariant;
  message: string;
}

/**
 * Feedback for actions that have already happened.
 *
 * Errors stay until dismissed — a failure the user missed is a failure they
 * will repeat — while confirmations clear themselves after a few seconds.
 */
const DEFAULT_DURATION: Record<ToastVariant, number> = {
  success: 4000,
  info: 5000,
  warning: 7000,
  error: 0,
};

const ICONS: Record<ToastVariant, ReactNode> = {
  success: <CheckCircle2 size={18} />,
  error: <XCircle size={18} />,
  warning: <AlertTriangle size={18} />,
  info: <Info size={18} />,
};

/** Beyond this the stack becomes a wall; the oldest drops off. */
const MAX_VISIBLE = 4;

export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { t } = useTranslation('common');
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextId = useRef(1);
  const timers = useRef(new Map<number, number>());

  const dismiss = useCallback((id: number) => {
    const timer = timers.current.get(id);
    if (timer) {
      window.clearTimeout(timer);
      timers.current.delete(id);
    }
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const push = useCallback(
    (variant: ToastVariant, message: string, options: ToastOptions = {}) => {
      const id = nextId.current++;
      const duration = options.duration ?? DEFAULT_DURATION[variant];

      setToasts((current) => [...current, { ...options, id, variant, message }].slice(-MAX_VISIBLE));

      if (duration > 0) {
        timers.current.set(
          id,
          window.setTimeout(() => dismiss(id), duration)
        );
      }
    },
    [dismiss]
  );

  const value = useMemo<ToastContextValue>(
    () => ({
      success: (message, options) => push('success', message, options),
      error: (message, options) => push('error', message, options),
      warning: (message, options) => push('warning', message, options),
      info: (message, options) => push('info', message, options),
      dismiss,
    }),
    [push, dismiss]
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      {/*
        `polite` rather than `assertive`: these announce the result of
        something the user just did, so they should not interrupt whatever a
        screen reader is currently saying.
      */}
      <div className={styles.viewport} role="region" aria-live="polite" aria-label={t('a11y.notifications')}>
        <AnimatePresence initial={false}>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              layout
              className={`${styles.toast} ${styles[toast.variant]}`}
              initial={{ opacity: 0, y: 16, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.97, transition: { duration: 0.15 } }}
              transition={{ type: 'spring', stiffness: 380, damping: 32 }}
            >
              <span className={styles.icon} aria-hidden="true">
                {ICONS[toast.variant]}
              </span>
              <div className={styles.body}>
                {toast.title && <p className={styles.title}>{toast.title}</p>}
                <p className={styles.message}>{toast.message}</p>
                {toast.action && (
                  <button
                    type="button"
                    className={styles.action}
                    onClick={() => {
                      toast.action?.onClick();
                      dismiss(toast.id);
                    }}
                  >
                    {toast.action.label}
                  </button>
                )}
              </div>
              <button
                type="button"
                className={styles.close}
                onClick={() => dismiss(toast.id)}
                aria-label={t('a11y.dismissNotification')}
              >
                <X size={15} />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
};
