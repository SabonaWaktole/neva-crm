import { getUserFirstName } from '../../utils/userUtils';
import styles from './StaffDashboard.module.css'; 
import { Users, CalendarCheck, AlertTriangle, History, FileText, UserPlus, CalendarPlus, TrendingUp, CheckCircle2, TrendingDown, Download } from 'lucide-react'; 
import { Button } from '../../components/ui/Button/Button'; 
import { KPICard } from '../../components/ui/KPICard'; 
import { TimelineItem } from '../../components/ui/TimelineItem'; 
import { StaffScheduleTable } from '../../components/widgets/StaffScheduleTable'; 
import { getActivityConfig } from '../../utils/activityMapper'; 
import { useDashboardMetrics, useActivityFeed } from '../../hooks/useDashboard'; 
import { useAppointmentsByDateRange } from '../../hooks/useAppointments';
import { useAuthStore } from '../../store/useAuthStore';

export const StaffDashboard = () => {
  const { user } = useAuthStore();
  const { metrics, isLoading: isLoadingMetrics } = useDashboardMetrics();
  const { activities, isLoading: isLoadingFeed } = useActivityFeed(5);
      
  // Today's boundaries for appointments
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date();
  endOfDay.setHours(23, 59, 59, 999);
      
  const { appointments, isLoading: isLoadingAppointments } = useAppointmentsByDateRange(
    startOfDay.toISOString(),
    endOfDay.toISOString()
  );

  const calculateGrowth = (current: number, past: number) => {
    if (past === 0) return current > 0 ? '+100%' : '0%';
    const pct = ((current - past) / past) * 100;
    return pct > 0 ? `+${pct.toFixed(1)}%` : `${pct.toFixed(1)}%`;
  };

  const growthPct = metrics ? calculateGrowth(metrics.totalClients, metrics.totalClientsLastWeek) : '0%';
  const isGrowthUp = metrics && metrics.totalClients >= metrics.totalClientsLastWeek;

  return (
    <div className={styles.dashboardContainer}>
             
      {/* Mobile-Only Header */}
      <div className={styles.mobileHeader}>
        <h1 className={styles.titleMobile}>Hello, {getUserFirstName(user)}</h1>
        <p className={styles.subtitleMobile}>You have {appointments?.length || 0} appointments scheduled for today.</p>
      </div>

      {/* Mobile-Only Quick Actions */}
      <div className={styles.mobileQuickActions}>
        <button className={styles.quickActionButtonPrimary}>
          <UserPlus size={24} />
          <span>Add Client</span>
        </button>
        <button className={styles.quickActionButtonSecondary}>
          <CalendarPlus size={24} />
          <span>New Appt</span>
        </button>
      </div>

      {/* Desktop Header */}
      <header className={styles.desktopHeader}>
        <div className={styles.headerContent}>
          <h1 className={styles.title}>Welcome back, {getUserFirstName(user)}.</h1>
          <p className={styles.subtitle}>Here's a summary of your individual pipeline for today.</p>
        </div>
        <div className={styles.headerActions}>
          <Button variant="outline" icon={<CalendarCheck size={18} />}>
            Today, Oct 24
          </Button>
          <Button variant="outline" icon={<Download size={18} />}>
            Export Report
          </Button>
        </div>
      </header>

      {/* Desktop KPI Bento Grid */}
      <section className={styles.kpiGridDesktop}>
        <div className={styles.kpiItem}>
          <KPICard 
            title="NEW CLIENTS"
            value={isLoadingMetrics ? '...' : (metrics?.totalClients || 0)}
            icon={<Users size={24} />}
            trendValue={isLoadingMetrics ? '...' : growthPct}
            trendLabel="vs last week"
            trendDirection={isGrowthUp ? 'up' : 'down'}
          />
        </div>
        <div className={styles.kpiItem}>
          <KPICard 
            title="MY ASSIGNED CLIENTS"
            value="156"
            icon={<Users size={24} />}
            iconColor="var(--color-secondary)"
            iconBgColor="var(--color-secondary-container)"
            trendLabel="Active Portfolio"
          />
        </div>
        {/* Expensive placeholder */}
        <div className={styles.kpiItem}>
          <KPICard 
            title="OPEN FOLLOW-UPS"
            value="---"
            icon={<AlertTriangle size={24} />}
            isPlaceholder={true}
            placeholderText="Coming in Phase 5"
          />
        </div>
      </section>

      {/* Main Grid Layout */}
      <div className={styles.mainGrid}>
                 
        {/* Left Column: Schedule Table & Actions */}
        <div className={styles.leftColumn}>
                     
          <div className={styles.scheduleCard}>
            <div className={styles.scheduleHeader}>
              <div className={styles.scheduleTitleGroup}>
                <CalendarCheck size={20} color="var(--color-primary)" />
                <h2>My Schedule</h2>
              </div>
              <Button variant="ghost">View Calendar</Button>
            </div>
            {isLoadingAppointments ? (
              <p style={{ padding: '1rem', color: 'var(--color-on-surface-variant)' }}>Loading appointments...</p>
            ) : (
              <StaffScheduleTable appointments={appointments || []} />
            )}
          </div>
                     
          {/* Mobile-Only Horizontal Stats Scroll */}
          <div className={styles.mobileStatsSection}>
             <h3>My Stats</h3>
             <div className={styles.statsScrollContainer}>
                <div className={styles.statCard}>
                   <span className={styles.statLabel}>REVENUE</span>
                   <span className={styles.statValue}>$12.4k</span>
                   <div className={styles.statTrendUp}><TrendingUp size={14}/> +8%</div>
                </div>
                <div className={styles.statCard}>
                   <span className={styles.statLabel}>CLOSED</span>
                   <span className={styles.statValue}>18</span>
                   <div className={styles.statTrendNeutral}><CheckCircle2 size={14}/> Target 20</div>
                </div>
                <div className={styles.statCard}>
                   <span className={styles.statLabel}>WIN RATE</span>
                   <span className={styles.statValue}>64%</span>
                   <div className={styles.statTrendDown}><TrendingDown size={14}/> -2%</div>
                </div>
             </div>
          </div>

          {/* Desktop-Only Quick Actions */}
          <div className={styles.desktopQuickActions}>
             <div className={styles.glassButton}>
                <CalendarPlus size={32} color="var(--color-primary)" />
                <div className={styles.glassButtonContent}>
                  <h3>Schedule Appointment</h3>
                  <p>Create a new meeting for your clients</p>
                </div>
             </div>
             <div className={styles.glassButton}>
                <FileText size={32} color="var(--color-secondary)" />
                <div className={styles.glassButtonContent}>
                  <h3>Log Note</h3>
                  <p>Record interaction details and summaries</p>
                </div>
             </div>
          </div>
         </div>
         
         {/* Right Column: Activity Feed */}
        <div className={styles.rightColumn}>
          <div className={styles.feedCard}>
            <div className={styles.feedHeader}>
              <div className={styles.feedTitleGroup}>
                <History size={20} color="var(--color-on-surface-variant)" />
                <h2>My Activity</h2>
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
              <Button variant="ghost" fullWidth>View All Activity</Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
