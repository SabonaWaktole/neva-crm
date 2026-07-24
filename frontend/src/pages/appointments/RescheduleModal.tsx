import React, { useState } from 'react';
import { Modal } from '../../components/ui/Modal/Modal';
import { TextInput } from '../../components/ui/TextInput/TextInput';
import { Button } from '../../components/ui/Button/Button';
import { Appointment } from '../../types/appointment';

interface RescheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  appointment: Appointment | null;
  onConfirm: (appointmentId: string, newDate: string, reason: string) => Promise<void>;
  isLoading?: boolean;
}

export const RescheduleModal: React.FC<RescheduleModalProps> = ({
  isOpen,
  onClose,
  appointment,
  onConfirm,
  isLoading
}) => {
  const [newDate, setNewDate] = useState('');
  const [newTime, setNewTime] = useState('');
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);

  React.useEffect(() => {
    if (isOpen && appointment) {
      const current = new Date(appointment.scheduledAt);
      const iso = current.toISOString();
      setNewDate(iso.split('T')[0]);
      setNewTime(iso.split('T')[1].substring(0, 5));
      setReason('');
      setError(null);
    }
  }, [isOpen, appointment]);

  if (!appointment) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDate || !newTime || !reason) {
      setError('Please fill out all fields');
      return;
    }
    
    const newDateTime = new Date(`${newDate}T${newTime}`).toISOString();

    try {
      await onConfirm(appointment.id, newDateTime, reason);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to reschedule');
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Reschedule Appointment">
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {error && <div style={{ color: 'red', fontSize: '0.875rem' }}>{error}</div>}
        
        <div style={{ display: 'flex', gap: '1rem' }}>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>New Date</label>
            <input 
              type="date" 
              value={newDate} 
              onChange={(e) => setNewDate(e.target.value)}
              style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--color-border)', fontFamily: 'inherit' }}
              required 
            />
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>New Time</label>
            <input 
              type="time" 
              value={newTime} 
              onChange={(e) => setNewTime(e.target.value)}
              style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--color-border)', fontFamily: 'inherit' }}
              required 
            />
          </div>
        </div>
        
        <TextInput
          label="Reason for Rescheduling"
          placeholder="E.g., Client requested a different time"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          required
        />
        
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1rem' }}>
          <Button variant="outline" onClick={onClose} type="button" disabled={isLoading}>Cancel</Button>
          <Button type="submit" disabled={isLoading}>Confirm Reschedule</Button>
        </div>
      </form>
    </Modal>
  );
};
