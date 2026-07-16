import { useState } from 'react';
import { AppointmentDetailPanel } from '../../components/panels/AppointmentDetailPanel/AppointmentDetailPanel';
import { 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Calendar as CalendarIcon, 
  Search, 
  Bell, 
  MoreVertical, 
  User,
  CheckCircle2 
} from 'lucide-react';
import { Button } from '../../components/ui/Button/Button';
import { Badge } from '../../components/ui/Badge/Badge';
import { Avatar } from '../../components/ui/Avatar/Avatar';
import { TextInput } from '../../components/ui/TextInput/TextInput';
import styles from './CalendarContent.module.css';

import { useAppointmentsByDateRange } from '../../hooks/useAppointments';
import { isSameDayLocal } from '../../utils/dateUtils';
import type { Appointment } from '../../types/appointment';

// Helper to map backend status to UI color tokens
const getStatusToken = (status: string) => {
  switch (status) {
    case 'SCHEDULED': return 'primary';
    case 'CONFIRMED': return 'emerald';
    case 'COMPLETED': return 'slate';
    case 'CANCELLED': return 'error';
    default: return 'amber';
  }
};

const CalendarDesktopView = ({ 
  appointments = [], 
  onAppointmentClick 
}: { 
  appointments: Appointment[],
  onAppointmentClick: (app: Appointment) => void 
}) => {
  const today = new Date(); // In a real app, this would be reactive state

  // Derive today's queue from the month's appointments
  const queueAppointments = (appointments || []).filter(app => isSameDayLocal(app.scheduledAt, today));
  
  return (
    <div className={styles.desktopView}>
      {/* TopNavBar Anchor */}
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.searchWrapper}>
            <TextInput 
              placeholder="Search appointments..." 
              iconLeft={<Search size={18} />}
            />
          </div>
          <nav className={styles.navLinks}>
            <a href="#">Dashboard</a>
            <a href="#">Clients</a>
            <a href="#" className={styles.activeLink}>Appointments</a>
            <a href="#">Tasks</a>
            <a href="#">Reports</a>
          </nav>
        </div>
        <div className={styles.headerRight}>
          <button className={styles.iconButton}>
            <Bell size={20} />
            <span className={styles.badgeIndicator}></span>
          </button>
          <div className={styles.divider}></div>
          <div className={styles.userProfile}>
            <Avatar fallback="AR" size="sm" />
            <span className={styles.userName}>Alex Rivera</span>
          </div>
        </div>
      </header>

      {/* Main Content Split */}
      <div className={styles.splitContent}>
        {/* Left: Calendar Canvas */}
        <section className={styles.calendarCanvas}>
          <div className={styles.calendarToolbar}>
            <div className={styles.monthSelector}>
              <h2>October 2024</h2>
              <div className={styles.monthControls}>
                <button><ChevronLeft size={16} /></button>
                <span>Today</span>
                <button><ChevronRight size={16} /></button>
              </div>
            </div>
            <div className={styles.calendarActions}>
              <div className={styles.segmentedControl}>
                <button>Day</button>
                <button>Week</button>
                <button className={styles.activeSegment}>Month</button>
              </div>
              <Button variant="primary" icon={<Plus size={18} />}>
                New Appointment
              </Button>
            </div>
          </div>

          <div className={styles.gridContainer}>
            <div className={styles.gridHeader}>
              <div>MON</div><div>TUE</div><div>WED</div><div>THU</div><div>FRI</div><div>SAT</div><div>SUN</div>
            </div>
            <div className={styles.gridCells}>
              <div className={styles.emptyCell}>30</div>
              {Array.from({ length: 31 }).map((_, i) => {
                const dayNumber = i + 1;
                // Naive mapping for visual placeholder — real app would map exact dates
                const dayAppointments = appointments.filter(app => {
                  const date = new Date(app.scheduledAt);
                  return date.getDate() === dayNumber && date.getMonth() === today.getMonth();
                });
                
                return (
                  <div key={dayNumber} className={styles.cell}>
                    <span className={styles.dayNumber}>{dayNumber}</span>
                    <div className={styles.eventList}>
                      {dayAppointments.map(app => {
                        const token = getStatusToken(app.status);
                        const time = new Date(app.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                        const title = app.clientName || 'Appointment';
                        // Capitalize token to match CSS class like eventPrimary
                        const capToken = token.charAt(0).toUpperCase() + token.slice(1);
                        return (
                          <div key={app.id} className={`${styles.eventChip} ${styles[`event${capToken}`]}`}>
                            {time} - {title}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Right: Queue */}
        <aside className={styles.queueSidebar}>
          <div className={styles.queueHeader}>
            <h3>Queue</h3>
            <p>3 upcoming for today</p>
          </div>
          <div className={styles.queueContent}>
            <div className={styles.statusLegend}>
              <div className={styles.legendItem}><span className={`${styles.dot} ${styles.dotPrimary}`}></span> Scheduled</div>
              <div className={styles.legendItem}><span className={`${styles.dot} ${styles.dotEmerald}`}></span> Confirmed</div>
              <div className={styles.legendItem}><span className={`${styles.dot} ${styles.dotSlate}`}></span> Completed</div>
              <div className={styles.legendItem}><span className={`${styles.dot} ${styles.dotError}`}></span> Cancelled</div>
              <div className={styles.legendItem}><span className={`${styles.dot} ${styles.dotAmber}`}></span> Rescheduled</div>
            </div>

            <div className={styles.queueList}>
              {queueAppointments.map(app => {
                const isCompleted = app.status === 'COMPLETED';
                const statusToken = getStatusToken(app.status);
                const time = new Date(app.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                
                return (
                  <div key={app.id} className={`${styles.queueCard} ${isCompleted ? styles.completedQueueCard : ''}`} onClick={() => onAppointmentClick(app)} style={{ cursor: 'pointer' }}>
                    <div className={styles.queueCardHeader}>
                      <span className={`${styles.queueTime} ${isCompleted ? styles.completedTime : styles[`text${statusToken}`]}`}>
                        {time}
                      </span>
                      {isCompleted ? <CheckCircle2 size={16} /> : <MoreVertical size={16} className={styles.moreIcon} />}
                    </div>
                    <h4 className={`${styles.queueClient} ${isCompleted ? styles.completedText : ''}`}>
                      {app.clientName || 'Unknown Client'}
                    </h4>
                    <p className={styles.queuePurpose}>{app.notes || 'No purpose provided'}</p>
                    <div className={styles.queueFooter}>
                      {!isCompleted && (
                        <div className={styles.avatarGroup}>
                          <Avatar fallback={app.staffName?.charAt(0) || 'U'} size="sm" className={styles.overlapAvatar} />
                        </div>
                      )}
                      <Badge variant={statusToken as any}>{app.status}</Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          <div className={styles.queueFooterAction}>
            <Button variant="outline" icon={<CalendarIcon size={18} />} fullWidth>
              Schedule Waitlist
            </Button>
          </div>
        </aside>
      </div>
    </div>
  );
};

// Sub-component: Mobile Agenda View
const CalendarMobileAgenda = ({ 
  appointments,
  onAppointmentClick 
}: { 
  appointments: Appointment[],
  onAppointmentClick: (app: Appointment) => void
}) => {
  const today = new Date();
  const agendaAppointments = appointments.filter(app => isSameDayLocal(app.scheduledAt, today));
  
  return (
    <div className={styles.mobileView}>
      {/* Top App Bar */}
      <header className={styles.mobileHeader}>
        <div className={styles.mobileHeaderTop}>
          <h1 className={styles.mobileTitle}>Nexus CRM</h1>
          <div className={styles.mobileActions}>
            <button><Bell size={20} /></button>
            <Avatar fallback="AR" size="sm" />
          </div>
        </div>
        <div className={styles.mobileViewSwitcher}>
          <button className={styles.activePill}>Day</button>
          <button>Week</button>
          <button>Month</button>
        </div>
      </header>

      {/* Main Agenda Content */}
      <main className={styles.mobileMain}>
        <section className={styles.horizontalDateScroller}>
          <div className={styles.dateScrollerHeader}>
            <h2>October 2023</h2>
            <CalendarIcon size={20} />
          </div>
          <div className={styles.dateCards}>
            <div className={styles.dateCard}><span>MON</span><strong>23</strong></div>
            <div className={`${styles.dateCard} ${styles.activeDateCard}`}><span>TUE</span><strong>24</strong></div>
            <div className={styles.dateCard}><span>WED</span><strong>25</strong></div>
            <div className={styles.dateCard}><span>THU</span><strong>26</strong></div>
            <div className={styles.dateCard}><span>FRI</span><strong>27</strong></div>
            <div className={styles.dateCard}><span>SAT</span><strong>28</strong></div>
          </div>
        </section>

        <section className={styles.agendaList}>
          {agendaAppointments.map(app => {
            const timeObj = new Date(app.scheduledAt);
            const timeStr = timeObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            const [time, ampm] = timeStr.split(' ');
            const isCompleted = app.status === 'COMPLETED';
            
            return (
              <div key={app.id} className={styles.agendaRow}>
                <div className={styles.agendaTimeBlock}>
                  <span className={styles.agendaTime}>{time}</span>
                  <span className={styles.agendaAmPm}>{ampm}</span>
                </div>
                <div className={`${styles.agendaCard} ${isCompleted ? styles.completedAgendaCard : ''}`} onClick={() => onAppointmentClick(app)} style={{ cursor: 'pointer' }}>
                  <div className={styles.agendaCardHeader}>
                    <h3 className={isCompleted ? styles.completedText : ''}>{app.notes || 'Appointment'}</h3>
                    {isCompleted ? <CheckCircle2 size={16} /> : <MoreVertical size={16} />}
                  </div>
                  <p>{app.status}</p>
                  <div className={styles.agendaCardFooter}>
                    <User size={14} />
                    <span>{app.clientName || 'Unknown Client'}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </section>
      </main>
    </div>
  );
};

export const CalendarContent = () => {
  // In a real implementation, startDate and endDate would be dynamically updated via state when navigating months
  const [currentDate] = useState(new Date());
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  
  // Create static strings for the current month boundary so the hook has referentially stable dependencies
  const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).toISOString();
  const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0, 23, 59, 59).toISOString();

  const { appointments, isLoading, error, updateAppointmentLocally } = useAppointmentsByDateRange(startOfMonth, endOfMonth);

  const handleAppointmentUpdated = (updated: Appointment) => {
    updateAppointmentLocally(updated);
    setSelectedAppointment(updated);
  };

  if (isLoading) return <div>Loading calendar...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <>
      <CalendarDesktopView appointments={appointments} onAppointmentClick={setSelectedAppointment} />
      <CalendarMobileAgenda appointments={appointments} onAppointmentClick={setSelectedAppointment} />
      
      <AppointmentDetailPanel 
        isOpen={!!selectedAppointment}
        onClose={() => setSelectedAppointment(null)}
        appointment={selectedAppointment}
        onAppointmentUpdated={handleAppointmentUpdated}
      />
    </>
  );
};
