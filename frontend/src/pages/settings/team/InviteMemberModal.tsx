import React, { useState, useEffect } from 'react';
import { Modal } from '../../../components/ui/Modal/Modal';
import { Button } from '../../../components/ui/Button/Button';
import { TextInput } from '../../../components/ui/TextInput/TextInput';
import { SelectInput } from '../../../components/ui/SelectInput/SelectInput';
import { useWarehouses } from '../../../hooks/useWarehouses';
import styles from './MemberModal.module.css';

interface InviteMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInvite: (email: string, role: string, warehouseId?: string) => Promise<void>;
}

export const InviteMemberModal: React.FC<InviteMemberModalProps> = ({
  isOpen,
  onClose,
  onInvite
}) => {
  const [email, setEmail] = useState('');
  const [warehouseId, setWarehouseId] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const { warehouses, fetchWarehouses } = useWarehouses();

  useEffect(() => {
    if (isOpen) {
      fetchWarehouses();
    }
  }, [isOpen, fetchWarehouses]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    try {
      await onInvite(email, 'STAFF', warehouseId || undefined);
      onClose();
      setEmail('');
      setWarehouseId('');
    } catch (err) {
      console.error(err);
      alert('Failed to send invitation');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Invite Team Member">
      <form onSubmit={handleSubmit} className={styles.form}>
        <TextInput
          label="Email Address"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="colleague@example.com"
          required
        />

        <SelectInput label="Role" value="STAFF" disabled helperText="Only STAFF role is supported for invitations at this time.">
          <option value="STAFF">Staff (Sales Representative)</option>
        </SelectInput>

        <SelectInput
          label="Assign Warehouse (Optional)"
          value={warehouseId}
          onChange={(e) => setWarehouseId(e.target.value)}
          helperText="If assigned, this staff member will only be able to view and manage products in this specific warehouse."
        >
          <option value="">No Warehouse (Dashboard Only)</option>
          {warehouses.map(w => (
            <option key={w.id} value={w.id}>{w.name}</option>
          ))}
        </SelectInput>

        <div className={styles.actions}>
          <Button variant="outline" onClick={onClose} type="button">Cancel</Button>
          <Button variant="primary" type="submit" isLoading={loading}>Send Invitation</Button>
        </div>
      </form>
    </Modal>
  );
};
