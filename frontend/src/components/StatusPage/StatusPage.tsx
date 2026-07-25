import type { ReactNode } from 'react';
import { ShieldAlert, FileQuestion, ServerCrash } from 'lucide-react';
import { Button } from '../ui/Button/Button';
import styles from './StatusPage.module.css';

export interface StatusPageProps {
  variant?: '401' | '403' | '404' | '500';
  title?: string;
  description?: string;
  action?: ReactNode;
}

const VARIANT_CONTENT: Record<
  NonNullable<StatusPageProps['variant']>,
  { icon: ReactNode; title: string; description: string }
> = {
  '401': {
    icon: <ShieldAlert size={40} />,
    title: 'Sign in required',
    description: 'You need to be signed in to view this page.',
  },
  '403': {
    icon: <ShieldAlert size={40} />,
    title: 'Unauthorized Access',
    description: "You don't have permission to view this page. If you think this is a mistake, contact your account owner.",
  },
  '404': {
    icon: <FileQuestion size={40} />,
    title: 'Page not found',
    description: "The page you're looking for doesn't exist or may have been moved.",
  },
  '500': {
    icon: <ServerCrash size={40} />,
    title: 'Something went wrong',
    description: 'An unexpected error occurred. Please try again.',
  },
};

export const StatusPage: React.FC<StatusPageProps> = ({
  variant = '404',
  title,
  description,
  action,
}) => {
  const content = VARIANT_CONTENT[variant];

  return (
    <div className={styles.container}>
      <div className={styles.iconWrapper}>{content.icon}</div>
      <h1 className={styles.title}>{title || content.title}</h1>
      <p className={styles.description}>{description || content.description}</p>
      {action ?? (
        <Button variant="primary" onClick={() => window.history.back()}>
          Go back
        </Button>
      )}
    </div>
  );
};
