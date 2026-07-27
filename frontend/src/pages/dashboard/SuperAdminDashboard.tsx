
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import styles from './SuperAdminDashboard.module.css';
import { 
  Users, 
  CheckCircle2, 
  Rocket,
  Wrench,
  AlertCircle,
  CreditCard,
  Plus,
  Banknote
} from 'lucide-react';
import { Button } from '../../components/ui/Button/Button';
import { KPICard } from '../../components/ui/KPICard';
import { TenantManagementTable } from '../../components/widgets/TenantManagementTable';
import { TimelineItem } from '../../components/ui/TimelineItem';
import { useTenants } from '../../hooks/useDashboard';

/**
 * The value shown where a metric is not implemented yet. Matches what the KPI
 * cards on this page already display, so "not measured" looks the same
 * everywhere on the console rather than varying by panel. TD-013.
 */
const PLACEHOLDER_VALUE = '---';

// Completely fake placeholder data for the activity log
const mockGlobalEvents = [
  {
    id: 'e-1',
    type: 'TENANT_PROVISIONED',
    title: 'New Tenant Provisioned',
    description: '"Starlight Logistics" successfully initialized on AWS-US-East-1 cluster.',
    timeAgo: '2 mins ago',
    icon: <Rocket size={20} />,
    color: 'var(--color-primary)',
    bg: 'var(--color-primary-fixed)'
  },
  {
    id: 'e-2',
    type: 'MAINTENANCE_SCHEDULED',
    title: 'Maintenance Scheduled',
    description: 'DB Migration for Core Services scheduled for Oct 15, 02:00 UTC.',
    timeAgo: '1 hour ago',
    icon: <Wrench size={20} />,
    color: 'var(--color-secondary)',
    bg: 'var(--color-secondary-fixed)'
  },
  {
    id: 'e-3',
    type: 'SECURITY_ALERT',
    title: 'Security Alert',
    description: 'Brute force attempt blocked for Admin user "j.doe@vertex.com".',
    timeAgo: '3 hours ago',
    icon: <AlertCircle size={20} />,
    color: 'var(--color-error)',
    bg: 'var(--color-error-container)'
  },
  {
    id: 'e-4',
    type: 'PAYMENT_SUCCEEDED',
    title: 'Payment Succeeded',
    description: 'Subscription renewal for "Neva AI Agency" processed successfully.',
    timeAgo: '5 hours ago',
    icon: <CreditCard size={20} />,
    color: 'var(--color-on-secondary-container)',
    bg: 'var(--color-surface-variant)'
  }
];

export const SuperAdminDashboard = () => {
  const { t } = useTranslation('dashboard');
  const navigate = useNavigate();
  const { tenants, total, isLoading: isLoadingTenants } = useTenants();

  return (
    <div className={styles.dashboardContainer}>
      
      {/* Header & Quick Action */}
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <h1 className={styles.title}>{t('superAdmin.title')}</h1>
          <p className={styles.subtitle}>{t('superAdmin.subtitle')}</p>
        </div>
        {/* Provisioning lives on the Tenants page, which owns the form and the
            list it updates. This is a route to it, not a second copy. */}
        <Button icon={<Plus size={20} />} onClick={() => navigate('/admin/tenants')}>
          {t('superAdmin.newTenant')}
        </Button>
      </header>

      {/* KPI Bento Grid */}
      <section className={styles.kpiGrid}>
        {/*
          The tenant count is real. Its trend was not: "+12% vs last month" and
          the 72% progress bar were hard-coded, so a genuine figure was wearing
          invented movement — the most credible kind of fabrication on the page,
          because the number beside it is true. No month-over-month tenant
          series is computed anywhere, so the trend props are gone rather than
          replaced. TD-013.
        */}
        <KPICard
          title={t('superAdmin.activeTenants')}
          value={isLoadingTenants ? '...' : total}
          icon={<Users size={24} />}
        />
        <KPICard
          title={t('superAdmin.globalMrr')}
          value={PLACEHOLDER_VALUE}
          icon={<Banknote size={24} />}
          iconColor="var(--color-secondary)"
          iconBgColor="var(--color-secondary-fixed)"
          isPlaceholder={true}
          placeholderText={t('superAdmin.comingPhase5')}
        />
        <KPICard
          title={t('superAdmin.systemHealth')}
          value={PLACEHOLDER_VALUE}
          icon={<CheckCircle2 size={24} />}
          iconColor="var(--color-success)"
          iconBgColor="var(--color-success-container)"
          isPlaceholder={true}
          placeholderText={t('superAdmin.comingPhase5')}
        />
      </section>

      {/* Main Grid Layout */}
      <div className={styles.mainGrid}>
        
        {/* Left Column: Tenant Table */}
        <div className={styles.leftColumn}>
          {/* Read-only here by design: the dashboard summarises, the Tenants
              page acts. Passing no handlers renders the table without its
              actions menu. */}
          <TenantManagementTable
            tenants={tenants}
            isLoading={isLoadingTenants}
            onViewAll={() => navigate('/admin/tenants')}
          />
        </div>

        {/* Right Column: Platform Activity Feed (PLACEHOLDER) */}
        <div className={styles.rightColumn}>
          <div className={styles.feedCardWrapper}>
            <div className={styles.feedCard}>
              <div className={styles.feedHeader}>
                <h2 className={styles.feedTitle}>{t('superAdmin.platformActivity')}</h2>
              </div>
              
              <div className={styles.feedList}>
                {mockGlobalEvents.map((event, index) => (
                  <TimelineItem 
                    key={event.id}
                    title={event.title}
                    subtitle={event.timeAgo}
                    content={event.description}
                    icon={event.icon}
                    iconTextColor={event.color}
                    iconBgColor={event.bg}
                    isLast={index === mockGlobalEvents.length - 1}
                  />
                ))}
              </div>
              
              <div className={styles.feedFooter}>
                <Button variant="ghost" fullWidth>{t('superAdmin.viewEventLog')}</Button>
              </div>
            </div>
            
            {/* Overlay to indicate this is a placeholder */}
            <div className={styles.placeholderOverlay}>
               <div className={styles.placeholderBadge}>{t('superAdmin.comingPhase5')}</div>
            </div>
          </div>
        </div>
      </div>

      {/*
        System Latency Visualizer (PLACEHOLDER).

        This panel already carried the "Coming in Phase 5" overlay, but the
        overlay is transparent, so the figures beneath it stayed fully legible:
        a Super Admin read "24ms" and "14.2k/s" as live platform telemetry with
        a small pill floating over them. A badge does not neutralise a specific
        number rendered next to a live-looking pulse dot.

        The values are now the same "---" this page's own KPI cards use for
        their unimplemented metrics, so the panel shows its shape without
        asserting a measurement. The bars below remain decorative; they carry no
        readable figure. Wire to real telemetry to replace both. TD-013.
      */}
      <div className={styles.latencyVisualizerWrapper}>
        <div className={styles.latencyVisualizer}>
          <div className={styles.latencyStats}>
            <div>
              <p className={styles.latencyLabel}>{t('superAdmin.globalLatency')}</p>
              <div className={styles.latencyValueGroup}>
                <span className={styles.latencyValue}>{PLACEHOLDER_VALUE}</span>
              </div>
            </div>
            <div className={styles.latencyDivider}></div>
            <div>
              <p className={styles.latencyLabel}>{t('superAdmin.activeRequests')}</p>
              <span className={styles.latencyValue}>{PLACEHOLDER_VALUE}</span>
            </div>
          </div>
          <div className={styles.trafficChart}>
             {/* Fake CSS bars */}
             <div className={styles.chartBars}>
               <div className={styles.bar} style={{ height: '50%', opacity: 0.4 }}></div>
               <div className={styles.bar} style={{ height: '75%', opacity: 0.6 }}></div>
               <div className={styles.bar} style={{ height: '66%', opacity: 0.4 }}></div>
               <div className={styles.bar} style={{ height: '100%', opacity: 1 }}></div>
               <div className={styles.bar} style={{ height: '50%', opacity: 0.5 }}></div>
               <div className={styles.bar} style={{ height: '80%', opacity: 0.8 }}></div>
               <div className={styles.bar} style={{ height: '33%', opacity: 0.4 }}></div>
               <div className={styles.bar} style={{ height: '66%', opacity: 1 }}></div>
             </div>
             <span className={styles.chartLabel}>{t('superAdmin.realtimeTraffic')}</span>
          </div>
        </div>
        
        {/* Overlay to indicate this is a placeholder */}
        <div className={styles.placeholderOverlay}>
           <div className={styles.placeholderBadge}>{t('superAdmin.comingPhase5')}</div>
        </div>
      </div>
      
    </div>
  );
};
