import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
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

interface AppointmentFormValues {
  clientId: string;
  assignedUserId: string;
  date: string;
  time: string;
  notes: string;
  /* NON-FUNCTIONAL: see the note on the High Priority toggle below. */
  isHighPriority: boolean;
}

export const AppointmentForm: React.FC<AppointmentFormProps> = ({
  lockedClientId,
  lockedClientName,
  onSubmit,
  onCancel
}) => {
  const { createAppointment, isLoading, error } = useCreateAppointment();
  const { user } = useAuthStore();

  const isLockedContext = !!lockedClientId;

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<AppointmentFormValues>({
    mode: 'onBlur',
    defaultValues: {
      clientId: lockedClientId || '',
      assignedUserId: user?.userId || '',
      date: '',
      time: '',
      notes: '',
      isHighPriority: false,
    },
  });

  useEffect(() => {
    if (user?.userId) {
      setValue('assignedUserId', user.userId);
    }
  }, [user, setValue]);

  const submitForm = async (values: AppointmentFormValues) => {
    try {
      const scheduledAt = new Date(`${values.date}T${values.time}`).toISOString();
      await createAppointment({
        clientId: lockedClientId || values.clientId,
        assignedUserId: values.assignedUserId,
        scheduledAt,
        notes: values.notes,
      });
      if (onSubmit) {
        onSubmit({});
      }
    } catch {
      // error is available in hook state
    }
  };

  return (
    <form
      className={`${styles.formContainer} ${isLockedContext ? styles.contextLayout : styles.standaloneLayout}`}
      onSubmit={handleSubmit(submitForm)}
      noValidate
    >
      
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
              required
              error={errors.clientId?.message}
              {...register('clientId', { required: 'Select a client for this appointment' })}
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
              required
              error={errors.date?.message}
              {...register('date', { required: 'Choose a date' })}
            />
          </div>
          <div className={styles.formGroup}>
            <TextInput
              type="time"
              label="Time"
              iconRight={<Clock size={18} />}
              required
              error={errors.time?.message}
              {...register('time', { required: 'Choose a time' })}
            />
          </div>
        </div>

        <div className={styles.formGroup}>
          <SelectInput label="Assigned Staff" {...register('assignedUserId')}>
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
            {...register('notes')}
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
            <span className={styles.visuallyHidden}>High Priority</span>
            <input
              type="checkbox"
              className={styles.toggleInput}
              {...register('isHighPriority')}
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
