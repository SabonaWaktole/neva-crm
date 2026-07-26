import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
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
import { useDateFormat } from '../../../hooks/useDateFormat';

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
    case 'CONFIRMED': return 'success';
    case 'COMPLETED': return 'secondary';
    case 'CANCELLED': return 'error';
    default: return 'warning';
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
  const dates = useDateFormat();
  const { t } = useTranslation('appointments');
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
      title={t('detail.title')}
      footer={
        <div className={styles.footerActions}>
          {isPromptingCancel ? (
            <div className={styles.cancelPrompt}>
              <TextInput 
                placeholder={t('detail.cancelReasonPlaceholder')} 
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                autoFocus
              />
              <div className={styles.cancelPromptButtons}>
                <Button variant="outline" onClick={() => setIsPromptingCancel(false)}>{t('detail.back')}</Button>
                <Button variant="primary" className={styles.cancelConfirmBtn} onClick={handleCancel} disabled={!cancelReason || isCancelling}>
                  {isCancelling ? t('detail.cancelling') : t('detail.confirmCancel')}
                </Button>
              </div>
            </div>
          ) : (
            <>
              {appointment.status === 'SCHEDULED' && (
                <Button variant="primary" icon={<Check size={18} />} fullWidth onClick={() => handleUpdateStatus('CONFIRMED')} disabled={isUpdating}>
                  {t('detail.markConfirmed')}
                </Button>
              )}
              {appointment.status === 'CONFIRMED' && (
                <Button variant="primary" icon={<CheckCircle2 size={18} />} fullWidth onClick={() => handleUpdateStatus('COMPLETED')} disabled={isUpdating}>
                  {t('detail.markCompleted')}
                </Button>
              )}
              <div className={styles.footerSecondary}>
                <Button variant="outline" icon={<Edit size={16} />} onClick={onEdit} disabled={isTerminal}>
                  {t('detail.edit')}
                </Button>
                <Button variant="outline" icon={<RefreshCw size={16} />} onClick={onReschedule} disabled={isTerminal}>
                  {t('detail.reschedule')}
                </Button>
                <Button variant="outline" icon={<XCircle size={16} />} className={styles.cancelButton} onClick={() => setIsPromptingCancel(true)} disabled={isTerminal}>
                  {t('detail.cancel')}
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
          <span className={styles.refCode}>
            {t('detail.reference', { reference: appointment.id.split('-')[0] })}
          </span>
        </div>

        {/* Client Section */}
        <div className={styles.section}>
          <label className={styles.sectionLabel}>{t('detail.client')}</label>
          <div className={styles.personCard}>
            <Avatar fallback={appointment.clientName?.charAt(0) || 'C'} size="lg" />
            <div className={styles.personInfo}>
              <h4 className={styles.personName}>{appointment.clientName || 'Unknown'}</h4>
              <div className={styles.personEmail}>
                <Mail size={14} />
                <span>{t('detail.noEmail')}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Staff Section */}
        <div className={styles.section}>
          <label className={styles.sectionLabel}>{t('detail.staffMember')}</label>
          <div className={styles.staffRow}>
            <Avatar fallback={appointment.staffName?.charAt(0) || 'S'} size="md" />
            <div>
              <p className={styles.staffName}>{appointment.staffName || t('detail.unassigned')}</p>
            </div>
          </div>
        </div>

        {/* Date & Time */}
        <div className={styles.dateTimeGrid}>
          <div className={styles.section}>
            <label className={styles.sectionLabel}>{t('detail.date')}</label>
            <div className={styles.infoRow}>
              <Calendar size={18} className={styles.infoIcon} />
              <span className={styles.infoText}>{dates.date(appointment.scheduledAt)}</span>
            </div>
          </div>
          <div className={styles.section}>
            <label className={styles.sectionLabel}>{t('detail.time')}</label>
            <div className={styles.infoRow}>
              <Clock size={18} className={styles.infoIcon} />
              <span className={styles.infoText}>{dates.time(appointment.scheduledAt)}</span>
            </div>
          </div>
        </div>

        {/* Purpose */}
        <div className={styles.section}>
          <label className={styles.sectionLabel}>{t('detail.notes')}</label>
          <div className={styles.purposeCard}>
            <p className={styles.purposeDesc}>{appointment.notes || 'No notes provided.'}</p>
          </div>
        </div>
      </div>
    </SlideOver>
  );
};
