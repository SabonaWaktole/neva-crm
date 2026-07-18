import React, { useState } from 'react';
import { 
  Calendar, 
  Clock, 
  Mail, 
  Edit, 
  RefreshCw, 
  XCircle,
  CheckCircle2,
  Check
} from 'lucide-react';
import { SlideOver } from '../../ui/SlideOver/SlideOver';
import { Badge } from '../../ui/Badge/Badge';
import { Avatar } from '../../ui/Avatar/Avatar';
import { Button } from '../../ui/Button/Button';
import { TextInput } from '../../ui/TextInput/TextInput';
import styles from './AppointmentDetailPanel.module.css';
import type { Appointment } from '../../../types/appointment';
import { useCancelAppointment, useUpdateAppointmentStatus } from '../../../hooks/useAppointments';

export interface AppointmentDetailPanelProps {
  isOpen: boolean;
  onClose: () => void;
  appointment: Appointment | null;
  onAppointmentUpdated?: (updated: Appointment) => void;
  onEdit?: () => void;
  onReschedule?: () => void;
}

const getStatusToken = (status: string) => {
  switch (status) {
    case 'SCHEDULED': return 'primary';
    case 'CONFIRMED': return 'emerald';
    case 'COMPLETED': return 'slate';
    case 'CANCELLED': return 'error';
    default: return 'amber';
  }
};

export const AppointmentDetailPanel: React.FC<AppointmentDetailPanelProps> = ({
  isOpen,
  onClose,
  appointment,
  onAppointmentUpdated,
  onEdit,
  onReschedule,
}) => {
  const { cancelAppointment, isLoading: isCancelling } = useCancelAppointment();
  const { updateStatus, isLoading: isUpdating } = useUpdateAppointmentStatus();
  const [cancelReason, setCancelReason] = useState('');
  const [isPromptingCancel, setIsPromptingCancel] = useState(false);

  if (!appointment) return null;

  const isTerminal = appointment.status === 'COMPLETED' || appointment.status === 'CANCELLED';

  const handleCancel = async () => {
    if (!cancelReason) return;
    try {
      const updated = await cancelAppointment(appointment.id, { reason: cancelReason });
      setIsPromptingCancel(false);
      setCancelReason('');
      if (onAppointmentUpdated) onAppointmentUpdated(updated);
    } catch (e) {
      // handled by hook
    }
  };

  const handleUpdateStatus = async (newStatus: 'CONFIRMED' | 'COMPLETED') => {
    try {
      const updated = await updateStatus(appointment.id, { status: newStatus });
      if (onAppointmentUpdated) onAppointmentUpdated(updated);
    } catch (e) {
      // handled by hook
    }
  };

  return (
    <SlideOver
      isOpen={isOpen}
      onClose={onClose}
      title="Appointment Detail"
      footer={
        <div className={styles.footerActions}>
          {isPromptingCancel ? (
            <div className={styles.cancelPrompt}>
              <TextInput 
                placeholder="Reason for cancellation..." 
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                autoFocus
              />
              <div className={styles.cancelPromptButtons}>
                <Button variant="outline" onClick={() => setIsPromptingCancel(false)}>Back</Button>
                <Button variant="primary" className={styles.cancelConfirmBtn} onClick={handleCancel} disabled={!cancelReason || isCancelling}>
                  {isCancelling ? 'Cancelling...' : 'Confirm Cancel'}
                </Button>
              </div>
            </div>
          ) : (
            <>
              {appointment.status === 'SCHEDULED' && (
                <Button variant="primary" icon={<Check size={18} />} fullWidth onClick={() => handleUpdateStatus('CONFIRMED')} disabled={isUpdating}>
                  Mark as Confirmed
                </Button>
              )}
              {appointment.status === 'CONFIRMED' && (
                <Button variant="primary" icon={<CheckCircle2 size={18} />} fullWidth onClick={() => handleUpdateStatus('COMPLETED')} disabled={isUpdating}>
                  Mark as Completed
                </Button>
              )}
              <div className={styles.footerSecondary}>
                <Button variant="outline" icon={<Edit size={16} />} onClick={onEdit} disabled={isTerminal}>
                  Edit
                </Button>
                <Button variant="outline" icon={<RefreshCw size={16} />} onClick={onReschedule} disabled={isTerminal}>
                  Reschedule
                </Button>
                <Button variant="outline" icon={<XCircle size={16} />} className={styles.cancelButton} onClick={() => setIsPromptingCancel(true)} disabled={isTerminal}>
                  Cancel
                </Button>
              </div>
            </>
          )}
        </div>
      }
    >
      <div className={styles.panelContent}>
        {/* Status & Reference */}
        <div className={styles.statusRow}>
          <Badge variant={getStatusToken(appointment.status) as any} className={styles.statusBadge}>
            <span className={styles.pulseDot}></span>
            {appointment.status}
          </Badge>
          <span className={styles.refCode}>Ref: #{appointment.id.split('-')[0]}</span>
        </div>

        {/* Client Section */}
        <div className={styles.section}>
          <label className={styles.sectionLabel}>Client</label>
          <div className={styles.personCard}>
            <Avatar fallback={appointment.clientName?.charAt(0) || 'C'} size="lg" />
            <div className={styles.personInfo}>
              <h4 className={styles.personName}>{appointment.clientName || 'Unknown'}</h4>
              <div className={styles.personEmail}>
                <Mail size={14} />
                <span>No email provided</span>
              </div>
            </div>
          </div>
        </div>

        {/* Staff Section */}
        <div className={styles.section}>
          <label className={styles.sectionLabel}>Staff Member</label>
          <div className={styles.staffRow}>
            <Avatar fallback={appointment.staffName?.charAt(0) || 'S'} size="md" />
            <div>
              <p className={styles.staffName}>{appointment.staffName || 'Unassigned'}</p>
            </div>
          </div>
        </div>

        {/* Date & Time */}
        <div className={styles.dateTimeGrid}>
          <div className={styles.section}>
            <label className={styles.sectionLabel}>Date</label>
            <div className={styles.infoRow}>
              <Calendar size={18} className={styles.infoIcon} />
              <span className={styles.infoText}>{new Date(appointment.scheduledAt).toLocaleDateString()}</span>
            </div>
          </div>
          <div className={styles.section}>
            <label className={styles.sectionLabel}>Time</label>
            <div className={styles.infoRow}>
              <Clock size={18} className={styles.infoIcon} />
              <span className={styles.infoText}>{new Date(appointment.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
          </div>
        </div>

        {/* Purpose */}
        <div className={styles.section}>
          <label className={styles.sectionLabel}>Notes / Purpose</label>
          <div className={styles.purposeCard}>
            <p className={styles.purposeDesc}>{appointment.notes || 'No notes provided.'}</p>
          </div>
        </div>
      </div>
    </SlideOver>
  );
};
