import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AppointmentDetailPanel } from '../../components/panels/AppointmentDetailPanel/AppointmentDetailPanel';
import { 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Calendar as CalendarIcon, 
  Bell, 
  MoreVertical, 
  User,
  CheckCircle2 
} from 'lucide-react';
import { Button } from '../../components/ui/Button/Button';
import { Badge } from '../../components/ui/Badge/Badge';
import { Avatar } from '../../components/ui/Avatar/Avatar';
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
  const { tenantSlug } = useParams();
  const navigate = useNavigate();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'day' | 'week' | 'month'>('month');

  const handlePrevMonth = () => {
    if (viewMode === 'month') {
      setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    } else if (viewMode === 'week') {
      setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() - 7));
    } else {
      setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() - 1));
    }
  };

  const handleNextMonth = () => {
    if (viewMode === 'month') {
      setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    } else if (viewMode === 'week') {
      setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() + 7));
    } else {
      setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() + 1));
    }
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  // Derive today's queue from the month's appointments (real logic: today relative to user's real today)
  const realToday = new Date();
  const queueAppointments = (appointments || []).filter(app => isSameDayLocal(app.scheduledAt, realToday));
  
  const monthYearString = currentDate.toLocaleDateString([], { month: 'long', year: 'numeric' });
  
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const dateObj = currentDate.getDate();
  const firstDayOfMonth = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startingDayOfWeek = firstDayOfMonth.getDay() === 0 ? 6 : firstDayOfMonth.getDay() - 1;
  const previousMonthDays = new Date(year, month, 0).getDate();
  
  // Week calculation
  const currentDayOfWeek = currentDate.getDay() === 0 ? 6 : currentDate.getDay() - 1;
  const startOfWeek = new Date(year, month, dateObj - currentDayOfWeek);

  // Formatting header string based on view
  let viewTitleString = monthYearString;
  if (viewMode === 'day') {
    viewTitleString = currentDate.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  } else if (viewMode === 'week') {
    const endOfWeek = new Date(startOfWeek.getFullYear(), startOfWeek.getMonth(), startOfWeek.getDate() + 6);
    viewTitleString = `${startOfWeek.toLocaleDateString([], { month: 'short', day: 'numeric' })} - ${endOfWeek.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}`;
  }

  return (
    <div className={styles.desktopView}>
      {/* Main Content Split (Header removed) */}
      <div className={styles.splitContent}>
        {/* Left: Calendar Canvas */}
        <section className={styles.calendarCanvas}>
          <div className={styles.calendarToolbar}>
            <div className={styles.monthSelector}>
              <h2>{viewTitleString}</h2>
              <div className={styles.monthControls}>
                <button onClick={handlePrevMonth}><ChevronLeft size={16} /></button>
                <span onClick={handleToday} style={{ cursor: 'pointer' }}>Today</span>
                <button onClick={handleNextMonth}><ChevronRight size={16} /></button>
              </div>
            </div>
            <div className={styles.calendarActions}>
              <div className={styles.segmentedControl}>
                <button className={viewMode === 'day' ? styles.activeSegment : ''} onClick={() => setViewMode('day')}>Day</button>
                <button className={viewMode === 'week' ? styles.activeSegment : ''} onClick={() => setViewMode('week')}>Week</button>
                <button className={viewMode === 'month' ? styles.activeSegment : ''} onClick={() => setViewMode('month')}>Month</button>
              </div>
              <Button variant="primary" icon={<Plus size={18} />} onClick={() => navigate(`/${tenantSlug}/appointments/new`)}>
                New Appointment
              </Button>
            </div>
          </div>

          <div className={styles.gridContainer}>
            <div className={styles.gridHeader} style={viewMode === 'day' ? { gridTemplateColumns: '1fr' } : {}}>
              {viewMode === 'day' ? (
                <div>{currentDate.toLocaleDateString([], { weekday: 'short' }).toUpperCase()}</div>
              ) : (
                <><div>MON</div><div>TUE</div><div>WED</div><div>THU</div><div>FRI</div><div>SAT</div><div>SUN</div></>
              )}
            </div>
            <div className={styles.gridCells} style={viewMode === 'day' ? { gridTemplateColumns: '1fr' } : {}}>
              {viewMode === 'month' && Array.from({ length: startingDayOfWeek }).map((_, i) => (
                <div key={`empty-${i}`} className={styles.emptyCell}>
                  {previousMonthDays - startingDayOfWeek + i + 1}
                </div>
              ))}
              
              {Array.from({ length: viewMode === 'month' ? daysInMonth : viewMode === 'week' ? 7 : 1 }).map((_, i) => {
                let cellDate: Date;
                if (viewMode === 'month') {
                  cellDate = new Date(year, month, i + 1);
                } else if (viewMode === 'week') {
                  cellDate = new Date(startOfWeek.getFullYear(), startOfWeek.getMonth(), startOfWeek.getDate() + i);
                } else {
                  cellDate = currentDate;
                }
                
                const dayNumber = cellDate.getDate();
                const dayAppointments = appointments.filter(app => {
                  const date = new Date(app.scheduledAt);
                  return date.getDate() === dayNumber && date.getMonth() === cellDate.getMonth() && date.getFullYear() === cellDate.getFullYear();
                });
                
                return (
                  <div key={cellDate.toISOString()} className={styles.cell}>
                    <span className={styles.dayNumber}>{viewMode !== 'month' ? cellDate.toLocaleDateString([], { month: 'short', day: 'numeric' }) : dayNumber}</span>
                    <div className={styles.eventList}>
                      {dayAppointments.map(app => {
                        const token = getStatusToken(app.status);
                        const time = new Date(app.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                        const title = app.clientName || 'Appointment';
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
            <p>{queueAppointments.length} upcoming for today</p>
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
