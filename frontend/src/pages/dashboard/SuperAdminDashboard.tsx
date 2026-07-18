import React from 'react';
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
    color: 'var(--color-tertiary)',
    bg: 'var(--color-tertiary-fixed)'
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
    description: 'Subscription renewal for "Nexus AI Agency" processed successfully.',
    timeAgo: '5 hours ago',
    icon: <CreditCard size={20} />,
    color: 'var(--color-on-secondary-container)',
    bg: 'var(--color-surface-variant)'
  }
];

export const SuperAdminDashboard = () => {
  const { tenants, total, isLoading: isLoadingTenants } = useTenants();

  return (
    <div className={styles.dashboardContainer}>
      
      {/* Header & Quick Action */}
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <h1 className={styles.title}>Platform Overview</h1>
          <p className={styles.subtitle}>Real-time health and tenant distribution metrics.</p>
        </div>
        <Button leftIcon={<Plus size={20} />}>
          Provision New Tenant
        </Button>
      </header>

      {/* KPI Bento Grid */}
      <section className={styles.kpiGrid}>
        <KPICard 
          title="Active Tenants"
          value={isLoadingTenants ? '...' : total}
          icon={<Users size={24} />}
          trendValue="+12%"
          trendLabel="vs last month"
          trendDirection="up"
          progress={72}
        />
        <KPICard 
          title="Global MRR"
          value="---"
          icon={<Banknote size={24} />}
          iconColor="var(--color-tertiary)"
          iconBgColor="var(--color-tertiary-fixed)"
          isPlaceholder={true}
          placeholderText="Coming in Phase 5"
        />
        <KPICard 
          title="System Health"
          value="---"
          icon={<CheckCircle2 size={24} />}
          iconColor="#10b981"
          iconBgColor="rgba(16, 185, 129, 0.15)"
          isPlaceholder={true}
          placeholderText="Coming in Phase 5"
        />
      </section>

      {/* Main Grid Layout */}
      <div className={styles.mainGrid}>
        
        {/* Left Column: Tenant Table */}
        <div className={styles.leftColumn}>
          <TenantManagementTable tenants={tenants} isLoading={isLoadingTenants} />
        </div>

        {/* Right Column: Platform Activity Feed (PLACEHOLDER) */}
        <div className={styles.rightColumn}>
          <div className={styles.feedCardWrapper}>
            <div className={styles.feedCard}>
              <div className={styles.feedHeader}>
                <h2 className={styles.feedTitle}>Platform Activity</h2>
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
                <Button variant="ghost" fullWidth>View Global Event Log</Button>
              </div>
            </div>
            
            {/* Overlay to indicate this is a placeholder */}
            <div className={styles.placeholderOverlay}>
               <div className={styles.placeholderBadge}>Coming in Phase 5</div>
            </div>
          </div>
        </div>
      </div>

      {/* System Latency Visualizer (PLACEHOLDER) */}
      <div className={styles.latencyVisualizerWrapper}>
        <div className={styles.latencyVisualizer}>
          <div className={styles.latencyStats}>
            <div>
              <p className={styles.latencyLabel}>Global Latency</p>
              <div className={styles.latencyValueGroup}>
                <div className={styles.pulseDot}></div>
                <span className={styles.latencyValue}>24ms</span>
              </div>
            </div>
            <div className={styles.latencyDivider}></div>
            <div>
              <p className={styles.latencyLabel}>Active Requests</p>
              <span className={styles.latencyValue}>14.2k/s</span>
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
             <span className={styles.chartLabel}>Real-time Traffic</span>
          </div>
        </div>
        
        {/* Overlay to indicate this is a placeholder */}
        <div className={styles.placeholderOverlay}>
           <div className={styles.placeholderBadge}>Coming in Phase 5</div>
        </div>
      </div>
      
    </div>
  );
};
