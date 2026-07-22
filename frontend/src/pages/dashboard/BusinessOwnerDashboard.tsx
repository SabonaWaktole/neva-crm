import { getUserFirstName } from '../../utils/userUtils';
import styles from './BusinessOwnerDashboard.module.css'; import {    Users,    CalendarCheck,    Clock,    Package,    Plus,   History } from 'lucide-react'; import { Button } from '../../components/ui/Button/Button'; import { KPICard } from '../../components/ui/KPICard'; import { UpcomingAppointmentsWidget } from '../../components/widgets/UpcomingAppointmentsWidget'; import { TimelineItem } from '../../components/ui/TimelineItem'; import { getActivityConfig } from '../../utils/activityMapper'; import { useNavigate, useParams } from 'react-router-dom'; import { useDashboardMetrics, useActivityFeed } from '../../hooks/useDashboard'; import { useAuthStore } from '../../store/useAuthStore';

export const BusinessOwnerDashboard = () => {
  const { tenantSlug } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { metrics, isLoading: isLoadingMetrics } = useDashboardMetrics();
  const { activities, isLoading: isLoadingFeed } = useActivityFeed(5);

  const calculateGrowth = (current: number, past: number) => {
    if (past === 0) return current > 0 ? '+100%' : '0%';
    const pct = ((current - past) / past) * 100;
    return pct > 0 ? `+${pct.toFixed(1)}%` : `${pct.toFixed(1)}%`;
  };

  const growthPct = metrics ? calculateGrowth(metrics.totalClients, metrics.totalClientsLastWeek) : '0%';
  const isGrowthUp = metrics && metrics.totalClients >= metrics.totalClientsLastWeek;

  return (
    <div className={styles.dashboardContainer}>
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <h1 className={styles.title}>Welcome back, {getUserFirstName(user)}.</h1>
          <p className={styles.subtitle}>Here's a summary of your workspace for today.</p>
        </div>
        <div className={styles.headerActions}>
          <Button variant="outline" icon={<CalendarCheck size={18} />} onClick={() => navigate(`/${tenantSlug}/appointments`)}>
            View Schedule
          </Button>
          <Button variant="primary" icon={<Plus size={18} />} onClick={() => navigate(`/${tenantSlug}/appointments/new`)}>
            New Appointment
          </Button>
        </div>
      </header>

      {/* KPI Bento Grid */}
      <section className={styles.kpiGrid}>
        <div className={styles.kpiItem}>
          <KPICard
            title="TOTAL CLIENTS"
            value={isLoadingMetrics ? '...' : (metrics?.totalClients || 0)}
            icon={<Users size={24} />}
            trendValue={isLoadingMetrics ? '...' : growthPct}
            trendLabel="vs last week"
            trendDirection={isGrowthUp ? 'up' : 'down'}
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
              {isLoadingFeed ? (
                <p style={{ padding: '1rem', color: 'var(--color-on-surface-variant)' }}>Loading activity...</p>
              ) : activities.length === 0 ? (
                <p style={{ padding: '1rem', color: 'var(--color-on-surface-variant)' }}>No recent activity.</p>
              ) : (
                activities.map((activity, index) => {
                  const config = getActivityConfig(activity.type);
                  return (
                    <TimelineItem
                      key={activity.id}
                      title={activity.type.replace(/_/g, ' ')}
                      subtitle={new Date(activity.timestamp).toLocaleString()}
                      content={`${activity.actor.name}: ${activity.description}`}
                      icon={config.icon}
                      iconTextColor={config.color}
                      iconBgColor={config.bg}
                      isLast={index === activities.length - 1}
                    />
                  );
                })
              )}
            </div>
            
            <div className={styles.feedFooter}>
              <Button variant="ghost" fullWidth onClick={() => navigate(`/${tenantSlug}/clients`)}>View All Activity</Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
