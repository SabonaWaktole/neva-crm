import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Modal } from '../../components/ui/Modal/Modal';
import { TextInput } from '../../components/ui/TextInput/TextInput';
import { Button } from '../../components/ui/Button/Button';
import type { Appointment } from '../../types/appointment';
import styles from './RescheduleModal.module.css';

interface RescheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  appointment: Appointment | null;
  onConfirm: (appointmentId: string, newDate: string, reason: string) => Promise<void>;
  isLoading?: boolean;
}

interface RescheduleFormValues {
  newDate: string;
  newTime: string;
  reason: string;
}

export const RescheduleModal: React.FC<RescheduleModalProps> = ({
  isOpen,
  onClose,
  appointment,
  onConfirm,
  isLoading,
}) => {
  const [submitError, setSubmitError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<RescheduleFormValues>({
    defaultValues: { newDate: '', newTime: '', reason: '' },
  });

  useEffect(() => {
    if (isOpen && appointment) {
      const iso = new Date(appointment.scheduledAt).toISOString();
      reset({
        newDate: iso.split('T')[0],
        newTime: iso.split('T')[1].substring(0, 5),
        reason: '',
      });
      setSubmitError(null);
    }
  }, [isOpen, appointment, reset]);

  if (!appointment) return null;

  const onSubmit = async (data: RescheduleFormValues) => {
    setSubmitError(null);
    const newDateTime = new Date(`${data.newDate}T${data.newTime}`).toISOString();

    try {
      await onConfirm(appointment.id, newDateTime, data.reason);
      onClose();
    } catch (err: any) {
      setSubmitError(err.message || 'Failed to reschedule');
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Reschedule Appointment">
      <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
        {submitError && <p className={styles.formError}>{submitError}</p>}

        <div className={styles.dateTimeRow}>
          <TextInput
            type="date"
            label="New Date"
            error={errors.newDate?.message}
            {...register('newDate', { required: 'Date is required' })}
          />
          <TextInput
            type="time"
            label="New Time"
            error={errors.newTime?.message}
            {...register('newTime', { required: 'Time is required' })}
          />
        </div>

        <TextInput
          label="Reason for Rescheduling"
          placeholder="E.g., Client requested a different time"
          error={errors.reason?.message}
          {...register('reason', { required: 'A reason is required' })}
        />

        <div className={styles.actions}>
          <Button variant="outline" onClick={onClose} type="button" disabled={isLoading}>
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? 'Rescheduling...' : 'Confirm Reschedule'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
