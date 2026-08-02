
import type { JSX } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import styles from './SuperAdminDashboard.module.css';
import {
  Users,
  CheckCircle2,
  Rocket,
  UserX,
  Building2,
  AlertCircle,
  Plus,
  Banknote
} from 'lucide-react';
import { Button } from '../../components/ui/Button/Button';
import { KPICard } from '../../components/ui/KPICard';
import { TenantManagementTable } from '../../components/widgets/TenantManagementTable';
import { TimelineItem } from '../../components/ui/TimelineItem';
import { useTenants, usePlatformActivity, useGlobalMrr, useSystemHealth, useSystemMetrics } from '../../hooks/useDashboard';
import type { PlatformActivityEvent } from '../../services/dashboardService';

/**
 * The value shown where a metric is not implemented yet. Matches what the KPI
 * cards on this page already display, so "not measured" looks the same
 * everywhere on the console rather than varying by panel. TD-013.
 */
const PLACEHOLDER_VALUE = '---';

/** How each audit-log `action` renders in the Platform Activity feed. */
const ACTIVITY_PRESENTATION: Record<
  string,
  { title: string; icon: JSX.Element; color: string; bg: string }
> = {
  TENANT_CREATED: {
    title: 'New Tenant Provisioned',
    icon: <Rocket size={20} />,
    color: 'var(--color-primary)',
    bg: 'var(--color-primary-fixed)',
  },
  TENANT_DELETED: {
    title: 'Tenant Deleted',
    icon: <Building2 size={20} />,
    color: 'var(--color-error)',
    bg: 'var(--color-error-container)',
  },
  TENANT_SUSPENDED: {
    title: 'Tenant Suspended',
    icon: <AlertCircle size={20} />,
    color: 'var(--color-error)',
    bg: 'var(--color-error-container)',
  },
  TENANT_REACTIVATED: {
    title: 'Tenant Reactivated',
    icon: <CheckCircle2 size={20} />,
    color: 'var(--color-success)',
    bg: 'var(--color-success-container)',
  },
  USER_SUSPENDED: {
    title: 'User Suspended',
    icon: <AlertCircle size={20} />,
    color: 'var(--color-error)',
    bg: 'var(--color-error-container)',
  },
  USER_REACTIVATED: {
    title: 'User Reactivated',
    icon: <CheckCircle2 size={20} />,
    color: 'var(--color-success)',
    bg: 'var(--color-success-container)',
  },
  USER_DELETED: {
    title: 'User Deleted',
    icon: <UserX size={20} />,
    color: 'var(--color-error)',
    bg: 'var(--color-error-container)',
  },
  OWNERSHIP_TRANSFERRED: {
    title: 'Ownership Transferred',
    icon: <Users size={20} />,
    color: 'var(--color-secondary)',
    bg: 'var(--color-secondary-fixed)',
  },
};

const describeActivity = (event: PlatformActivityEvent): string => {
  const meta = event.metadata ?? {};
  switch (event.action) {
    case 'TENANT_CREATED':
      return `"${meta.companyName ?? 'A new workspace'}" was provisioned.`;
    case 'TENANT_DELETED':
      return `"${meta.companyName ?? 'A workspace'}" was permanently deleted.`;
    case 'TENANT_SUSPENDED':
      return `"${meta.companyName ?? 'A workspace'}" was suspended.`;
    case 'TENANT_REACTIVATED':
      return `"${meta.companyName ?? 'A workspace'}" was reactivated.`;
    case 'USER_SUSPENDED':
      return `${meta.targetEmail ?? 'An account'} was suspended.`;
    case 'USER_REACTIVATED':
      return `${meta.targetEmail ?? 'An account'} was reactivated.`;
    case 'USER_DELETED':
      return `${meta.targetEmail ?? 'An account'} was removed from the platform.`;
    case 'OWNERSHIP_TRANSFERRED':
      return 'Workspace ownership was transferred to another staff member.';
    default:
      return event.action;
  }
};

const formatTimeAgo = (isoDate: string): string => {
  const seconds = Math.max(0, Math.floor((Date.now() - new Date(isoDate).getTime()) / 1000));
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min${minutes === 1 ? '' : 's'} ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? '' : 's'} ago`;
};

const formatMrr = (amountCents: number, currency: string): string =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency, maximumFractionDigits: 0 }).format(
    amountCents / 100
  );

export const SuperAdminDashboard = () => {
  const { t } = useTranslation('dashboard');
  const navigate = useNavigate();
  const { tenants, total, isLoading: isLoadingTenants } = useTenants();
  const { events: activityEvents, isLoading: isLoadingActivity } = usePlatformActivity();
  const { mrr, isLoading: isLoadingMrr } = useGlobalMrr();
  const { health, isLoading: isLoadingHealth } = useSystemHealth();
  const { metrics, isLoading: isLoadingMetrics } = useSystemMetrics();

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
        {/*
          Real endpoint, real value: no plan/price field exists anywhere in the
          schema yet, so there is nothing to sum and this is genuinely $0 today
          rather than an unimplemented placeholder. It becomes a real figure the
          moment billing data is modeled, with no further UI change needed.
        */}
        <KPICard
          title={t('superAdmin.globalMrr')}
          value={isLoadingMrr || !mrr ? '...' : formatMrr(mrr.amountCents, mrr.currency)}
          icon={<Banknote size={24} />}
          iconColor="var(--color-secondary)"
          iconBgColor="var(--color-secondary-fixed)"
        />
        {/* Reflects a real check against the database, not a hard-coded "Healthy". */}
        <KPICard
          title={t('superAdmin.systemHealth')}
          value={isLoadingHealth || !health ? '...' : health.status === 'HEALTHY' ? 'Healthy' : 'Degraded'}
          icon={<CheckCircle2 size={24} />}
          iconColor={health?.status === 'DEGRADED' ? 'var(--color-error)' : 'var(--color-success)'}
          iconBgColor={health?.status === 'DEGRADED' ? 'var(--color-error-container)' : 'var(--color-success-container)'}
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

        {/* Right Column: Platform Activity Feed, backed by the audit log */}
        <div className={styles.rightColumn}>
          <div className={styles.feedCardWrapper}>
            <div className={styles.feedCard}>
              <div className={styles.feedHeader}>
                <h2 className={styles.feedTitle}>{t('superAdmin.platformActivity')}</h2>
              </div>

              <div className={styles.feedList}>
                {isLoadingActivity && activityEvents.length === 0 ? (
                  <p className={styles.feedEmpty}>Loading…</p>
                ) : activityEvents.length === 0 ? (
                  <p className={styles.feedEmpty}>No platform activity yet.</p>
                ) : (
                  activityEvents.map((event, index) => {
                    const presentation = ACTIVITY_PRESENTATION[event.action] ?? {
                      title: event.action,
                      icon: <Users size={20} />,
                      color: 'var(--color-on-secondary-container)',
                      bg: 'var(--color-surface-variant)',
                    };
                    return (
                      <TimelineItem
                        key={event.id}
                        title={presentation.title}
                        subtitle={formatTimeAgo(event.createdAt)}
                        content={describeActivity(event)}
                        icon={presentation.icon}
                        iconTextColor={presentation.color}
                        iconBgColor={presentation.bg}
                        isLast={index === activityEvents.length - 1}
                      />
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/*
        Backed by GetSystemMetricsUseCase (/api/tenants/metrics), which reads
        this process's own request timings — not a synthesized figure. Polls
        every 5s (see useSystemMetrics) so "real-time" is a live read, not the
        moment the page loaded. TD-013.
      */}
      <div className={styles.latencyVisualizerWrapper}>
        <div className={styles.latencyVisualizer}>
          <div className={styles.latencyStats}>
            <div>
              <p className={styles.latencyLabel}>{t('superAdmin.globalLatency')}</p>
              <div className={styles.latencyValueGroup}>
                <span className={styles.pulseDot}></span>
                <span className={styles.latencyValue}>
                  {isLoadingMetrics || !metrics ? PLACEHOLDER_VALUE : `${metrics.avgLatencyMs}ms`}
                </span>
              </div>
            </div>
            <div className={styles.latencyDivider}></div>
            <div>
              <p className={styles.latencyLabel}>{t('superAdmin.activeRequests')}</p>
              <span className={styles.latencyValue}>
                {isLoadingMetrics || !metrics ? PLACEHOLDER_VALUE : `${metrics.requestsPerSecond}/s`}
              </span>
            </div>
          </div>
          <div className={styles.trafficChart}>
             <div className={styles.chartBars}>
               {(metrics?.buckets ?? Array(8).fill(0)).map((count, index) => {
                 const max = Math.max(...(metrics?.buckets ?? [0]), 1);
                 const heightPct = count > 0 ? Math.max((count / max) * 100, 10) : 3;
                 return <div key={index} className={styles.bar} style={{ height: `${heightPct}%` }}></div>;
               })}
             </div>
             <span className={styles.chartLabel}>{t('superAdmin.realtimeTraffic')}</span>
          </div>
        </div>
      </div>

    </div>
  );
};
