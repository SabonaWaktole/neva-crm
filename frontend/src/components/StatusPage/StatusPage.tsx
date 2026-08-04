import type { ReactNode } from 'react';
import { ShieldAlert, FileQuestion, ServerCrash } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '../ui/Button/Button';
import styles from './StatusPage.module.css';

export interface StatusPageProps {
  variant?: '401' | '403' | '404' | '500';
  title?: string;
  description?: string;
  action?: ReactNode;
}

/**
 * Only the icon is a module constant. The title and description used to sit
 * here alongside it, which meant they were fixed in English at import time —
 * before any language had been resolved — and never changed afterwards. They
 * are looked up per render now; the icon has no language to be wrong about.
 */
const VARIANT_ICON: Record<NonNullable<StatusPageProps['variant']>, ReactNode> = {
  '401': <ShieldAlert size={40} />,
  '403': <ShieldAlert size={40} />,
  '404': <FileQuestion size={40} />,
  '500': <ServerCrash size={40} />,
};

export const StatusPage: React.FC<StatusPageProps> = ({
  variant = '404',
  title,
  description,
  action,
}) => {
  const { t } = useTranslation('common');

  return (
    <div className={styles.container}>
      <div className={styles.iconWrapper}>{VARIANT_ICON[variant]}</div>
      <h1 className={styles.title}>{title || t(`status.${variant}.title`)}</h1>
      <p className={styles.description}>{description || t(`status.${variant}.description`)}</p>
      {action ?? (
        <Button variant="primary" onClick={() => window.history.back()}>
          {t('status.goBack')}
        </Button>
      )}
    </div>
  );
};
