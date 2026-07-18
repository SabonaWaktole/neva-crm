import React from 'react';
import styles from './StaffDashboard.module.css';
import { 
  Users, 
  CalendarCheck, 
  AlertTriangle,
  History,
  PhoneCall,
  Video,
  FileText,
  Mail,
  UserPlus,
  CalendarPlus,
  TrendingUp,
  CheckCircle2,
  TrendingDown,
  Download
} from 'lucide-react';
import { Button } from '../../components/ui/Button/Button';
import { KPICard } from '../../components/ui/KPICard';
import { StaffScheduleTable } from '../../components/widgets/StaffScheduleTable';
import { TimelineItem } from '../../components/ui/TimelineItem';
import { getActivityConfig } from '../../utils/activityMapper';

// Mock data matching GetTenantActivityFeedUseCase / TimelineMerger schema
const mockActivities = [
  {
    id: '1',
    timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    type: 'INTERACTION_ADDED',
    description: 'Interaction (CALL)',
    actor: 'Alex Carter',
    details: { channel: 'CALL', content: 'Spoke with Sarah Jenkins re enterprise proposal' }
  },
  {
    id: '2',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    type: 'INTERACTION_ADDED',
    description: 'Interaction (NOTE)',
    actor: 'Alex Carter',
    details: { channel: 'NOTE', content: 'Added note to Global Logistics Deal' }
  },
  {
    id: '3',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(),
    type: 'INTERACTION_ADDED',
    description: 'Interaction (EMAIL)',
    actor: 'Alex Carter',
    details: { channel: 'EMAIL', content: 'Sent welcome package to David Miller' }
  },
  {
    id: '4',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    type: 'APPOINTMENT_SCHEDULED',
    description: 'Appointment (SCHEDULED)',
    actor: 'Alex Carter',
    statusLabel: 'SCHEDULED',
    details: { notes: 'Demo with Acme Corp for tomorrow 11:30 AM', status: 'SCHEDULED' }
  }
];

const mockAppointments = [
  {
    id: 'app-1',
    clientId: 'Jordan Smith',
    notes: 'Contract Review',
    type: 'Video Call',
    status: 'COMPLETED' as const,
    scheduledAt: new Date(new Date().setHours(9, 0, 0, 0)).toISOString(),
    assignedUserId: 'Alex Carter',
    tenantId: 'tenant-1',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'app-2',
    clientId: 'Acme Corp',
    notes: 'Product Walkthrough',
    type: 'On-Site',
    status: 'CONFIRMED' as const,
    scheduledAt: new Date(new Date().setHours(11, 30, 0, 0)).toISOString(),
    assignedUserId: 'Alex Carter',
    tenantId: 'tenant-1',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'app-3',
    clientId: 'Elena Rodriguez',
    notes: 'Quarterly Update',
    type: 'Video Call',
    status: 'SCHEDULED' as const,
    scheduledAt: new Date(new Date().setHours(14, 0, 0, 0)).toISOString(),
    assignedUserId: 'Alex Carter',
    tenantId: 'tenant-1',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'app-4',
    clientId: 'Markus Vane',
    notes: 'Onboarding Session',
    type: 'Phone',
    status: 'SCHEDULED' as const,
    scheduledAt: new Date(new Date().setHours(16, 30, 0, 0)).toISOString(),
    assignedUserId: 'Alex Carter',
    tenantId: 'tenant-1',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

const formatTimeAgo = (isoString: string) => {
  const date = new Date(isoString);
  const diffInMinutes = Math.floor((Date.now() - date.getTime()) / 60000);
  
  if (diffInMinutes < 60) return `${diffInMinutes} mins ago`;
  if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)} hours ago`;
  return 'Yesterday';
};

export const StaffDashboard = () => {
  return (
    <div className={styles.dashboardContainer}>
      
      {/* Mobile-Only Header */}
      <div className={styles.mobileHeader}>
        <h1 className={styles.titleMobile}>Hello, Alex</h1>
        <p className={styles.subtitleMobile}>You have 4 appointments scheduled for today.</p>
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
          <h1 className={styles.title}>Welcome back, Alex.</h1>
          <p className={styles.subtitle}>Here's a summary of your individual pipeline for today.</p>
        </div>
        <div className={styles.headerActions}>
          <Button variant="outline" leftIcon={<CalendarCheck size={18} />}>
            Today, Oct 24
          </Button>
          <Button variant="outline" leftIcon={<Download size={18} />}>
            Export Report
          </Button>
        </div>
      </header>

      {/* Desktop KPI Bento Grid */}
      <section className={styles.kpiGridDesktop}>
        <div className={styles.kpiItem}>
          <KPICard 
            title="MY APPOINTMENTS TODAY"
            value="8"
            icon={<CalendarCheck size={24} />}
            trendValue="+2"
            trendLabel="from yesterday"
            trendDirection="up"
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
          
          <StaffScheduleTable appointments={mockAppointments} />
          
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
                <h2>{/* Mobile says "Recent Activity", Desktop says "My Activity", we'll just say "My Activity" */}My Activity</h2>
              </div>
            </div>
            
            <div className={styles.feedList}>
              {mockActivities.map((activity, index) => {
                const config = getActivityConfig(activity.type, activity.details);
                
                let title = activity.description;
                if (activity.type === 'INTERACTION_ADDED') {
                  title = `Interaction (${activity.details?.channel})`;
                } else if (activity.type.startsWith('APPOINTMENT_')) {
                  title = activity.details?.purposeTitle || `Appointment ${config.statusLabel || ''}`;
                }

                return (
                  <TimelineItem 
                    key={activity.id}
                    title={title}
                    subtitle={formatTimeAgo(activity.timestamp)}
                    content={activity.details?.content || activity.details?.notes}
                    icon={config.icon}
                    iconBgColor={config.bg}
                    iconTextColor={config.color}
                    statusLabel={config.statusLabel}
                    statusColor={config.statusColor}
                    statusBgColor={config.statusBgColor}
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
