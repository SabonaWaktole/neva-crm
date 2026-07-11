import { ChevronRight, Edit3, Mail, MoreVertical, Phone, Settings, Filter, Search, PhoneCall, Video, FileText } from 'lucide-react';
import { Card } from '../../components/ui/Card/Card';
import { Badge } from '../../components/ui/Badge/Badge';
import { Avatar } from '../../components/ui/Avatar/Avatar';
import { Button } from '../../components/ui/Button/Button';
import { TimelineItem } from '../../components/ui/TimelineItem/TimelineItem';
import styles from './ClientDetailContent.module.css';

export const ClientDetailContent: React.FC = () => {
  return (
    <div className={styles.container}>
      {/* Header section */}
      <div className={styles.headerArea}>
        <div className={styles.breadcrumbs}>
          <span className={styles.breadcrumbLink}>Clients</span>
          <ChevronRight size={14} className={styles.breadcrumbSeparator} />
          <span className={styles.breadcrumbCurrent}>Acme Corp</span>
        </div>

        <div className={styles.headerMain}>
          <div className={styles.headerLeft}>
            <div className={styles.companyLogo}>
              <span className={styles.companyInitials}>AC</span>
            </div>
            <div className={styles.companyInfo}>
              <div className={styles.companyTitleRow}>
                <h1 className={styles.companyName}>Acme Corporation</h1>
                <Badge variant="primary">Active</Badge>
              </div>
              <p className={styles.companySubtitle}>
                Enterprise Software Solutions · B2B · San Francisco, CA
              </p>
            </div>
          </div>
          <div className={styles.headerActions}>
            <Button variant="outline" className={styles.iconButton}>
              <Edit3 size={18} />
            </Button>
            <Button variant="outline" className={styles.iconButton}>
              <Mail size={18} />
            </Button>
            <Button variant="outline" className={styles.iconButton}>
              <MoreVertical size={18} />
            </Button>
          </div>
        </div>
      </div>

      {/* Grid Layout */}
      <div className={styles.gridContainer}>
        {/* Left Column */}
        <div className={styles.leftColumn}>
          {/* Key Contact Card */}
          <Card padding="lg">
            <h2 className={styles.cardTitle}>Key Contact</h2>
            <div className={styles.contactDetails}>
              <Avatar
                size="lg"
                fallback="SJ"
                className={styles.contactAvatar}
              />
              <div className={styles.contactInfo}>
                <h3 className={styles.contactName}>Sarah Jenkins</h3>
                <p className={styles.contactTitle}>VP of Engineering</p>
              </div>
            </div>
            <div className={styles.contactActions}>
              <a href="mailto:sarah.j@acmecorp.com" className={styles.contactLink}>
                <Mail size={16} /> sarah.j@acmecorp.com
              </a>
              <a href="tel:+14155552671" className={styles.contactLink}>
                <Phone size={16} /> +1 (415) 555-2671
              </a>
            </div>
          </Card>

          {/* Custom Fields Card */}
          <Card padding="lg" className={styles.customFieldsCard}>
            <div className={styles.cardHeader}>
              <h2 className={styles.cardTitle}>About</h2>
              <button className={styles.settingsButton}>
                <Settings size={16} />
              </button>
            </div>
            <div className={styles.fieldsList}>
              <div className={styles.fieldRow}>
                <span className={styles.fieldLabel}>Industry</span>
                <span className={styles.fieldValue}>Technology</span>
              </div>
              <div className={styles.fieldRow}>
                <span className={styles.fieldLabel}>Annual Revenue</span>
                <span className={styles.fieldValue}>$50M - $100M</span>
              </div>
              <div className={styles.fieldRow}>
                <span className={styles.fieldLabel}>Lead Source</span>
                <span className={styles.fieldValue}>Inbound Webinar</span>
              </div>
              <div className={styles.fieldRow}>
                <span className={styles.fieldLabel}>Customer Since</span>
                <span className={styles.fieldValue}>Oct 12, 2021</span>
              </div>
              <div className={styles.fieldRow}>
                <span className={styles.fieldLabel}>Renewal Date</span>
                <span className={styles.fieldValue}>Oct 12, 2024</span>
              </div>
            </div>
          </Card>
        </div>

        {/* Right Column */}
        <div className={styles.rightColumn}>
          <Card padding="lg" className={styles.timelineCard}>
            <div className={styles.cardHeader}>
              <h2 className={styles.cardTitle}>Interactions</h2>
              <div className={styles.timelineActions}>
                <Button variant="outline" className={styles.smallIconButton}>
                  <Filter size={16} />
                </Button>
                <Button variant="outline" className={styles.smallIconButton}>
                  <Search size={16} />
                </Button>
              </div>
            </div>

            <div className={styles.logActivityRow}>
              <Button variant="outline" className={styles.logActivityButton}>
                <PhoneCall size={16} /> Log Call
              </Button>
              <Button variant="outline" className={styles.logActivityButton}>
                <Mail size={16} /> Email
              </Button>
              <Button variant="outline" className={styles.logActivityButton}>
                <Video size={16} /> Meeting
              </Button>
              <Button variant="outline" className={styles.logActivityButton}>
                <FileText size={16} /> Note
              </Button>
            </div>

            <div className={styles.timelineList}>
              <TimelineItem
                title="Discovery Call with Sarah"
                subtitle="Today at 10:30 AM · by Alex Martinez"
                content="Discussed Q3 expansion goals. Sarah is interested in upgrading their current tier to Enterprise to accommodate 50 new seats. Needs proposal by EOD Friday."
                icon={<Video size={16} />}
                iconBgColor="var(--color-primary-container)"
                iconTextColor="var(--color-on-primary-container)"
                statusLabel="Completed"
                statusBgColor="var(--color-surface-container-highest)"
                statusColor="var(--color-on-surface)"
              />
              <TimelineItem
                title="Email: Proposal Sent"
                subtitle="Yesterday at 4:15 PM · by Alex Martinez"
                content="Sent the initial draft of the proposal for review. Awaiting feedback."
                icon={<Mail size={16} />}
                iconBgColor="var(--color-secondary-container)"
                iconTextColor="var(--color-on-secondary-container)"
              />
              <TimelineItem
                title="Quick check-in call"
                subtitle="Oct 10, 2023 · by Alex Martinez"
                content="Touched base on current usage. Team is happy but requested additional training for the new hires."
                icon={<PhoneCall size={16} />}
                iconBgColor="var(--color-surface-container-highest)"
                iconTextColor="var(--color-on-surface)"
              />
              <TimelineItem
                title="Account Transition"
                subtitle="Sep 1, 2023 · System"
                content="Account ownership transferred from David Lee to Alex Martinez."
                icon={<FileText size={16} />}
                iconBgColor="var(--color-surface-container-high)"
                iconTextColor="var(--color-on-surface-variant)"
                isLast
              />
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
