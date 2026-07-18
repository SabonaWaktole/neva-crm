import React from 'react';
import styles from './BusinessOwnerDashboard.module.css';
import { 
  Users, 
  CalendarCheck, 
  Clock, 
  Package, 
  Plus,
  UserPlus,
  CalendarPlus,
  History,
  MessageSquarePlus,
  Zap
} from 'lucide-react';
import { Button } from '../../components/ui/Button/Button';
import { KPICard } from '../../components/ui/KPICard';
import { UpcomingAppointmentsWidget } from '../../components/widgets/UpcomingAppointmentsWidget';
import { TimelineItem } from '../../components/ui/TimelineItem';

// Mock data matching GetTenantActivityFeedUseCase schema
const mockActivities = [
  {
    id: '1',
    timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    type: 'CLIENT_CREATED',
    description: 'Added Sarah Jenkins to the workspace',
    actor: 'Alex Carter',
    details: { clientId: 'client-1' }
  },
  {
    id: '2',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    type: 'INTERACTION_LOGGED',
    description: 'Added a note to Global Logistics Deal',
    actor: 'Alex Carter',
    details: { clientId: 'client-2', interactionType: 'NOTE' }
  },
  {
    id: '3',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    type: 'APPOINTMENT_SCHEDULED',
    description: 'Scheduled "Demo" with Acme Corp',
    actor: 'Alex Carter',
    details: { appointmentId: 'app-1', clientId: 'client-3' }
  }
];

const getActivityConfig = (type: string) => {
  switch (type) {
    case 'CLIENT_CREATED':
      return { icon: <UserPlus size={20} />, color: 'var(--color-primary)', bg: 'var(--color-primary-fixed)' };
    case 'CLIENT_UPDATED':
      return { icon: <Users size={20} />, color: 'var(--color-secondary)', bg: 'var(--color-secondary-fixed)' };
    case 'APPOINTMENT_SCHEDULED':
      return { icon: <CalendarPlus size={20} />, color: 'var(--color-secondary)', bg: 'var(--color-secondary-fixed)' };
    case 'APPOINTMENT_COMPLETED':
      return { icon: <CalendarCheck size={20} />, color: 'var(--color-primary)', bg: 'var(--color-primary-fixed)' };
    case 'INTERACTION_LOGGED':
      return { icon: <MessageSquarePlus size={20} />, color: 'var(--color-outline)', bg: 'var(--color-surface-variant)' };
    case 'SYSTEM_EVENT':
      return { icon: <Zap size={20} />, color: 'var(--color-error)', bg: 'var(--color-error-container)' };
    default:
      return { icon: <History size={20} />, color: 'var(--color-outline)', bg: 'var(--color-surface-variant)' };
  }
};

const formatTimeAgo = (isoString: string) => {
  const date = new Date(isoString);
  const diffInMinutes = Math.floor((Date.now() - date.getTime()) / 60000);
  
  if (diffInMinutes < 60) return `${diffInMinutes} mins ago`;
  if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)} hours ago`;
  return 'Yesterday';
};

export const BusinessOwnerDashboard = () => {
  return (
    <div className={styles.dashboardContainer}>
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <h1 className={styles.title}>Welcome back, Alex.</h1>
          <p className={styles.subtitle}>Here's a summary of your workspace for today.</p>
        </div>
        <div className={styles.headerActions}>
          <Button variant="outline" leftIcon={<CalendarCheck size={18} />}>
            Today, Oct 24
          </Button>
          <Button variant="primary" leftIcon={<Plus size={18} />}>
            Add Record
          </Button>
        </div>
      </header>

      {/* KPI Bento Grid */}
      <section className={styles.kpiGrid}>
        <div className={styles.kpiItem}>
          <KPICard 
            title="TOTAL CLIENTS"
            value="156"
            icon={<Users size={24} />}
            trendValue="+12"
            trendLabel="vs last month"
            trendDirection="up"
          />
        </div>
        <div className={styles.kpiItem}>
          <KPICard 
            title="APPOINTMENTS"
            value="8"
            icon={<CalendarCheck size={24} />}
            iconColor="var(--color-secondary)"
            iconBgColor="var(--color-secondary-container)"
            trendValue="+2"
            trendLabel="from yesterday"
            trendDirection="up"
          />
        </div>
        {/* Expensive placeholers: opacity-60, ---, coming soon tag */}
        <div className={`${styles.kpiItem} ${styles.mobileHidden}`}>
          <KPICard 
            title="OPEN QUOTATIONS"
            value="---"
            icon={<Clock size={24} />}
            isPlaceholder={true}
            placeholderText="Coming in Phase 5"
          />
        </div>
        <div className={`${styles.kpiItem} ${styles.mobileHidden}`}>
          <KPICard 
            title="INVENTORY ALERTS"
            value="---"
            icon={<Package size={24} />}
            isPlaceholder={true}
            placeholderText="Coming in Phase 4"
          />
        </div>
      </section>

      {/* Main Grid Layout */}
      <div className={styles.mainGrid}>
        
        {/* Left Column: Schedule & Future Widgets */}
        <div className={styles.leftColumn}>
          
          <UpcomingAppointmentsWidget />
          
          {/* Quick Actions / Future Placeholders */}
          <div className={styles.placeholdersGrid}>
             <div className={styles.dashedPlaceholder}>
                <Clock size={32} className={styles.placeholderIcon} />
                <h3>Future Quotation Insights</h3>
                <p>Track pending approvals and pipeline value.</p>
             </div>
             <div className={styles.dashedPlaceholder}>
                <Package size={32} className={styles.placeholderIcon} />
                <h3>Inventory Forecasting</h3>
                <p>Predict stock shortages based on upcoming appointments.</p>
             </div>
          </div>
        </div>

        {/* Right Column: Activity Feed */}
        <div className={styles.rightColumn}>
          <div className={styles.feedCard}>
            <div className={styles.feedHeader}>
              <div className={styles.feedTitleGroup}>
                <History size={20} color="var(--color-on-surface-variant)" />
                <h2>Recent Activity</h2>
              </div>
            </div>
            
            <div className={styles.feedList}>
              {mockActivities.map((activity, index) => {
                const config = getActivityConfig(activity.type);
                return (
                  <TimelineItem 
                    key={activity.id}
                    title={activity.actor}
                    subtitle={formatTimeAgo(activity.timestamp)}
                    content={activity.description}
                    icon={config.icon}
                    iconBgColor={config.bg}
                    iconTextColor={config.color}
                    isLast={index === mockActivities.length - 1}
                  />
                );
              })}
            </div>
            
            <div className={styles.feedFooter}>
              <Button variant="ghost" fullWidth>View All Activity</Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
