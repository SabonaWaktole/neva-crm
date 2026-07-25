import React from 'react';
import { useUpcomingAppointments } from '../../hooks/useAppointments';
import { Calendar, MoreVertical, Clock, User } from 'lucide-react';
import { Card } from '../ui/Card/Card';
import { Badge } from '../ui/Badge/Badge';
import { Button } from '../ui/Button/Button';
import styles from './UpcomingAppointmentsWidget.module.css';

// TODO: This is a functional placeholder widget built without a Stitch design reference.
// It uses existing components (Card, Badge) to fulfill the requirements of Milestone 3.
// It should receive a proper Stitch design pass when the full Dashboard is finalized.



import { useNavigate, useParams } from 'react-router-dom';

export const UpcomingAppointmentsWidget: React.FC = () => {
  const { tenantSlug } = useParams();
  const navigate = useNavigate();
  const { appointments, isLoading, error } = useUpcomingAppointments(5);

  const getStatusToken = (status: string) => {
    switch (status) {
      case 'SCHEDULED': return 'primary';
      case 'CONFIRMED': return 'emerald';
      case 'COMPLETED': return 'slate';
      case 'CANCELLED': return 'error';
      default: return 'amber';
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' }) + ', ' + 
           date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <Card padding="lg" className={styles.widgetContainer}>
      <div className={styles.widgetHeader}>
        <div className={styles.titleGroup}>
          <div className={styles.iconWrapper}>
            <Calendar size={20} />
          </div>
          <h2 className={styles.title}>Upcoming Appointments</h2>
        </div>
        <Button variant="outline" className={styles.viewAllButton} onClick={() => navigate(`/${tenantSlug}/appointments`)}>
          View Calendar
        </Button>
      </div>

      <div className={styles.appointmentList}>
        {isLoading && <div className={styles.loadingText}>Loading...</div>}
        {error && <div className={styles.errorText}>{error}</div>}
        {!isLoading && !error && appointments.length === 0 && (
          <div className={styles.emptyText}>No upcoming appointments</div>
        )}
        
        {appointments.map((appointment) => (
          <div key={appointment.id} className={styles.appointmentRow}>
            <div className={styles.timeBlock}>
              <Clock size={14} className={styles.mutedIcon} />
              <span className={styles.timeText}>{formatTime(appointment.scheduledAt)}</span>
            </div>
            
            <div className={styles.detailsBlock}>
              <div className={styles.clientInfo}>
                <User size={14} className={styles.mutedIcon} />
                <span className={styles.clientName}>{appointment.clientName || 'Unknown Client'}</span>
              </div>
              <p className={styles.purposeText}>{appointment.notes || 'No purpose provided'}</p>
            </div>
            
            <div className={styles.actionBlock}>
              <Badge variant={getStatusToken(appointment.status) as any}>
                {appointment.status}
              </Badge>
              <button className={styles.moreButton} disabled title="More options coming soon" aria-label="More options (coming soon)">
                <MoreVertical size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};
