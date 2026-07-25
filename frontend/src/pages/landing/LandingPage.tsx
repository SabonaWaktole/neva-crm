import { useNavigate } from 'react-router-dom';
import { Network, ArrowRight, Building2, ShieldCheck, Zap } from 'lucide-react';
import { Button } from '../../components/ui/Button/Button';
import styles from './LandingPage.module.css';

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className={styles.page}>
      {/* Navigation Bar */}
      <nav className={styles.nav}>
        <div className={styles.brand}>
          <Network size={28} color="var(--color-primary)" />
          <span className={styles.brandText}>Neva CRM</span>
        </div>
        <div className={styles.navActions}>
          <Button variant="outline" onClick={() => navigate('/login')}>
            Sign In
          </Button>
          <Button variant="primary" onClick={() => navigate('/register-business')}>
            Get Started
          </Button>
        </div>
      </nav>

      {/* Hero Section */}
      <main className={styles.hero}>
        <div className={styles.badge}>
          <Zap size={14} />
          <span>Neva v2.0 is now live!</span>
        </div>

        <h1 className={styles.title}>
          Manage your enterprise with absolute clarity.
        </h1>

        <p className={styles.subtitle}>
          The ultimate multi-tenant CRM designed for scale, speed, and security.
          Empower your teams to do their best work in a unified workspace.
        </p>

        <div className={styles.ctaRow}>
          <Button
            variant="primary"
            icon={<ArrowRight size={18} />}
            iconPosition="right"
            onClick={() => navigate('/register-business')}
            className={styles.ctaButton}
          >
            Create Your Workspace
          </Button>
        </div>

        {/* Feature Grid */}
        <div className={styles.featureGrid}>
          <div className={styles.featureCard}>
            <div className={styles.featureIcon} style={{ backgroundColor: 'var(--color-primary-container)', color: 'var(--color-primary)' }}>
              <Building2 size={24} />
            </div>
            <h3 className={styles.featureTitle}>True Multi-Tenancy</h3>
            <p className={styles.featureDescription}>Isolated data environments ensuring complete privacy and dedicated branding for every workspace.</p>
          </div>

          <div className={styles.featureCard}>
            <div className={styles.featureIcon} style={{ backgroundColor: 'var(--color-secondary-container)', color: 'var(--color-on-secondary-container)' }}>
              <ShieldCheck size={24} />
            </div>
            <h3 className={styles.featureTitle}>Enterprise Security</h3>
            <p className={styles.featureDescription}>Bank-grade encryption, strict Role-Based Access Control (RBAC), and full compliance reporting.</p>
          </div>

          <div className={styles.featureCard}>
            <div className={styles.featureIcon} style={{ backgroundColor: 'var(--color-surface-variant)', color: 'var(--color-on-surface-variant)' }}>
              <Zap size={24} />
            </div>
            <h3 className={styles.featureTitle}>Lightning Fast</h3>
            <p className={styles.featureDescription}>Optimized API responses and instantaneous UI updates keep your team moving at the speed of thought.</p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className={styles.footer}>
        © 2026 Neva CRM. All rights reserved.
      </footer>
    </div>
  );
};
