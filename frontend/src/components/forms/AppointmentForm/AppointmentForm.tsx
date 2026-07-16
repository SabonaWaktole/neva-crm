import React, { useState } from 'react';
import { useCreateAppointment } from '../../../hooks/useAppointments';
import { useAuthStore } from '../../../store/useAuthStore';
import { 
  Search, 
  CalendarDays, 
  Calendar, 
  Clock, 
  Building2, 
  Lock, 
  AlertCircle, 
  CalendarCheck,
  UserSearch
} from 'lucide-react';
import { Button } from '../../ui/Button/Button';
import { Card } from '../../ui/Card/Card';
import { TextInput } from '../../ui/TextInput/TextInput';
import { SelectInput } from '../../ui/SelectInput/SelectInput';
import { TextareaInput } from '../../ui/TextareaInput/TextareaInput';
import styles from './AppointmentForm.module.css';

export interface AppointmentFormProps {
  lockedClientId?: string;
  lockedClientName?: string;
  onSubmit?: (data: any) => void;
  onCancel?: () => void;
}

export const AppointmentForm: React.FC<AppointmentFormProps> = ({ 
  lockedClientId, 
  lockedClientName,
  onSubmit,
  onCancel
}) => {
  const { createAppointment, isLoading, error } = useCreateAppointment();
  const { user } = useAuthStore();
  
  // Form State
  const [clientId, setClientId] = useState(lockedClientId || '');
  const [assignedUserId, setAssignedUserId] = useState(user?.userId || ''); 
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [notes, setNotes] = useState('');
  const [isHighPriority, setIsHighPriority] = useState(false);

  React.useEffect(() => {
    if (user?.userId && !assignedUserId) {
      setAssignedUserId(user.userId);
    }
  }, [user, assignedUserId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!date || !time || (!lockedClientId && !clientId)) {
      return; // Basic validation
    }
    
    try {
      const scheduledAt = new Date(`${date}T${time}`).toISOString();
      await createAppointment({
        clientId: lockedClientId || clientId,
        assignedUserId,
        scheduledAt,
        notes
      });
      if (onSubmit) {
        onSubmit({});
      }
    } catch (err) {
      // error is available in hook state
    }
  };

  const isLockedContext = !!lockedClientId;

  return (
    <form className={`${styles.formContainer} ${isLockedContext ? styles.contextLayout : styles.standaloneLayout}`} onSubmit={handleSubmit}>
      
      {/* SECTION 1: Client Information */}
      <Card padding="xl" className={styles.sectionCard}>
        {!isLockedContext && (
          <div className={styles.sectionHeader}>
            <UserSearch size={24} className={styles.headerIcon} />
            <h2>Client Information</h2>
          </div>
        )}

        {isLockedContext ? (
          <div className={styles.formGroup}>
            <label className={styles.lockedLabel}>Client Identity</label>
            <div className={styles.lockedClientField}>
              <Building2 size={20} className={styles.headerIcon} />
              <span className={styles.lockedClientName}>{lockedClientName || 'Unknown Client'}</span>
              <Lock size={18} className={styles.lockIcon} />
            </div>
          </div>
        ) : (
          <div className={styles.formGroup}>
            <TextInput 
              label="Search Client"
              placeholder="Start typing client name..."
              iconLeft={<Search size={18} />}
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
            />
          </div>
        )}

        <div className={styles.formGroup}>
          <SelectInput label="Appointment Type">
            <option value="initial">Initial Consultation</option>
            <option value="review">Quarterly Review</option>
            <option value="support">Technical Integration Support</option>
            <option value="strategy">Strategic Planning Session</option>
          </SelectInput>
        </div>
      </Card>

      {/* SECTION 2: Schedule & Staff */}
      <Card padding="xl" className={styles.sectionCard}>
        {!isLockedContext && (
          <div className={styles.sectionHeader}>
            <CalendarDays size={24} className={styles.headerIcon} />
            <h2>Schedule & Staff</h2>
          </div>
        )}

        <div className={styles.rowGrid}>
          <div className={styles.formGroup}>
            <TextInput 
              type="date"
              label="Date"
              iconRight={<Calendar size={18} />}
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>
          <div className={styles.formGroup}>
            <TextInput 
              type="time"
              label="Time"
              iconRight={<Clock size={18} />}
              value={time}
              onChange={(e) => setTime(e.target.value)}
              required
            />
          </div>
        </div>

        <div className={styles.formGroup}>
          <SelectInput 
            label="Assigned Staff"
            value={assignedUserId}
            onChange={(e) => setAssignedUserId(e.target.value)}
          >
            {user && <option value={user.userId}>Myself</option>}
            <option value="1">Marcus Thorne (Lead Architect)</option>
            <option value="2">Elena Vance (Senior Consultant)</option>
            <option value="3">Riley Matthews (Account Manager)</option>
          </SelectInput>
        </div>

        <div className={styles.formGroup}>
          <TextareaInput 
            label="Purpose of Appointment"
            placeholder="Briefly describe the objective of this meeting..."
            rows={4}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>

        {/* NON-FUNCTIONAL / DECORATIVE: This "High Priority" toggle is a visual element
            from the Stitch HTML design. There is NO corresponding `priority` field on the
            backend Appointment entity (approved fields: id, tenantId, clientId, assignedUserId,
            scheduledAt, status, notes). This toggle state is local-only and is NOT submitted
            or persisted. Do NOT wire this to any API call in Step 4 without first adding a
            priority field to the domain model and running it through the full TDD cycle. */}
        <div className={styles.priorityToggleContainer}>
          <div className={styles.priorityToggleInfo}>
            <AlertCircle size={24} className={styles.priorityIcon} />
            <div>
              <div className={styles.priorityTitle}>High Priority</div>
              <div className={styles.priorityDesc}>Flags this in the global calendar</div>
            </div>
          </div>
          
          <label className={styles.toggleSwitch}>
            <input 
              type="checkbox" 
              checked={isHighPriority}
              onChange={(e) => setIsHighPriority(e.target.checked)}
              className={styles.toggleInput}
            />
            <div className={styles.toggleTrack}></div>
          </label>
        </div>
      </Card>

      {/* FOOTER ACTIONS */}
      <div className={styles.formActions}>
        {error && <div className={styles.errorText}>{error}</div>}
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
            Cancel
          </Button>
        )}
        <Button 
          type="submit" 
          variant="primary" 
          icon={<CalendarCheck size={18} />}
          fullWidth={isLockedContext}
          disabled={isLoading}
        >
          {isLoading ? 'Confirming...' : 'Confirm Appointment'}
        </Button>
      </div>

    </form>
  );
};
