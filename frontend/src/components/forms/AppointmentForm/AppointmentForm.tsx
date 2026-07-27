import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { useCreateAppointment } from '../../../hooks/useAppointments';
import { useTeam } from '../../../hooks/useTeam';
import { getStaffDisplayName } from '../../../utils/userUtils';
import { useAuthStore } from '../../../store/useAuthStore';
import { 
  Search, 
  CalendarDays, 
  Calendar, 
  Clock, 
  Building2, 
  Lock,
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
}

export const AppointmentForm: React.FC<AppointmentFormProps> = ({
  lockedClientId,
  lockedClientName,
  onSubmit,
  onCancel
}) => {
  const { t } = useTranslation('appointments');
  const { createAppointment, isLoading, error } = useCreateAppointment();
  const { staff, fetchStaff } = useTeam();
  const { user } = useAuthStore();

  const isLockedContext = !!lockedClientId;

  /**
   * Assignable colleagues: everyone except the current user, who already has a
   * dedicated "Myself" option, and except deactivated members.
   *
   * `/auth/staff` returns deactivated members too (they carry `isActive: false`
   * so Team Settings can still manage them), so the filter has to happen here.
   * Assigning new work to someone who can no longer sign in would guarantee the
   * appointment is never actioned.
   */
  const assignableStaff = staff.filter(
    (member) => member.id !== user?.userId && member.isActive !== false
  );

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
    },
  });

  useEffect(() => {
    fetchStaff();
  }, [fetchStaff]);

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
            <h2>{t('form.clientInformation')}</h2>
          </div>
        )}

        {isLockedContext ? (
          <div className={styles.formGroup}>
            <label className={styles.lockedLabel}>{t('form.clientIdentity')}</label>
            <div className={styles.lockedClientField}>
              <Building2 size={20} className={styles.headerIcon} />
              <span className={styles.lockedClientName}>{lockedClientName || t('form.unknownClient')}</span>
              <Lock size={18} className={styles.lockIcon} />
            </div>
          </div>
        ) : (
          <div className={styles.formGroup}>
            <TextInput
              label={t('form.searchClient')}
              placeholder={t('form.searchClientPlaceholder')}
              iconLeft={<Search size={18} />}
              required
              error={errors.clientId?.message}
              {...register('clientId', { required: t('form.clientRequired') })}
            />
          </div>
        )}

        {/*
          REMOVED: an "Appointment Type" select offering four options. It was
          bound to nothing — no register(), no value, no onChange — and the
          Appointment entity has no `type` field to hold a choice, so whatever
          the user picked was discarded on submit. Removed rather than labelled
          "coming soon", because there is no pending work to wire it to. If
          appointment types are wanted, they start with a domain field. TD-020.
        */}
      </Card>

      {/* SECTION 2: Schedule & Staff */}
      <Card padding="xl" className={styles.sectionCard}>
        {!isLockedContext && (
          <div className={styles.sectionHeader}>
            <CalendarDays size={24} className={styles.headerIcon} />
            <h2>{t('form.scheduleAndStaff')}</h2>
          </div>
        )}

        <div className={styles.rowGrid}>
          <div className={styles.formGroup}>
            <TextInput
              type="date"
              label={t('form.date')}
              iconRight={<Calendar size={18} />}
              required
              error={errors.date?.message}
              {...register('date', { required: t('form.dateRequired') })}
            />
          </div>
          <div className={styles.formGroup}>
            <TextInput
              type="time"
              label={t('form.time')}
              iconRight={<Clock size={18} />}
              required
              error={errors.time?.message}
              {...register('time', { required: t('form.timeRequired') })}
            />
          </div>
        </div>

        <div className={styles.formGroup}>
          {/*
            These options were three invented people with ids "1", "2" and "3".
            `assignedUserId` is a non-nullable foreign key to User, so choosing
            any of them made Postgres reject the insert — only "Myself" ever
            worked. They are now the tenant's real staff. See TD-022.
          */}
          <SelectInput label={t('form.assignedStaff')} {...register('assignedUserId')}>
            {user && <option value={user.userId}>{t('form.myself')}</option>}
            {assignableStaff.map((member) => (
              <option key={member.id} value={member.id}>
                {getStaffDisplayName(member)}
              </option>
            ))}
          </SelectInput>
        </div>

        <div className={styles.formGroup}>
          <TextareaInput
            label={t('form.purpose')}
            placeholder={t('form.purposePlaceholder')}
            rows={4}
            {...register('notes')}
          />
        </div>

        {/*
          REMOVED: a "High Priority" toggle. Its own comment already recorded
          that the Appointment entity has no `priority` field and that the value
          was never submitted or persisted — so it was a switch the user could
          flip that changed nothing, and the disclosure lived in the source
          where no user reads it. Removed for the same reason as the type
          select above: wiring it up starts with a domain field. TD-020.
        */}
      </Card>

      {/* FOOTER ACTIONS */}
      <div className={styles.formActions}>
        {error && <div className={styles.errorText}>{error}</div>}
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
            {t('form.cancel')}
          </Button>
        )}
        <Button 
          type="submit" 
          variant="primary" 
          icon={<CalendarCheck size={18} />}
          fullWidth={isLockedContext}
          disabled={isLoading}
        >
          {isLoading ? t('form.confirming') : t('form.confirmAppointment')}
        </Button>
      </div>

    </form>
  );
};
