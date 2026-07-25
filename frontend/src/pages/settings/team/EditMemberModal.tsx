import React, { useState, useEffect } from 'react';
import { Modal } from '../../../components/ui/Modal/Modal';
import { Button } from '../../../components/ui/Button/Button';
import { SelectInput } from '../../../components/ui/SelectInput/SelectInput';
import { useWarehouses } from '../../../hooks/useWarehouses';
import type { StaffMember } from '../../../hooks/useTeam';
import styles from './MemberModal.module.css';

interface EditMemberModalProps {
  member: StaffMember | null;
  onClose: () => void;
  onUpdate: (userId: string, role: string, warehouseId?: string) => Promise<void>;
}

export const EditMemberModal: React.FC<EditMemberModalProps> = ({
  member,
  onClose,
  onUpdate
}) => {
  const [role, setRole] = useState('STAFF');
  const [warehouseId, setWarehouseId] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const { warehouses, fetchWarehouses } = useWarehouses();

  useEffect(() => {
    if (member) {
      setRole(member.role);
      setWarehouseId(member.warehouseId || '');
      fetchWarehouses();
    }
  }, [member, fetchWarehouses]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!member) return;
    setLoading(true);
    try {
      await onUpdate(member.id, role, warehouseId || undefined);
      onClose();
    } catch (err) {
      console.error(err);
      alert('Failed to update member');
    } finally {
      setLoading(false);
    }
  };

  if (!member) return null;

  return (
    <Modal isOpen={!!member} onClose={onClose} title="Edit Team Member">
      <p className={styles.subtitle}>Editing {member.email}</p>
      <form onSubmit={handleSubmit} className={styles.form}>
        <SelectInput label="Role" value={role} onChange={(e) => setRole(e.target.value)}>
          <option value="STAFF">Staff (Sales Representative)</option>
          <option value="BUSINESS_OWNER">Business Owner</option>
        </SelectInput>

        <SelectInput label="Assign Warehouse" value={warehouseId} onChange={(e) => setWarehouseId(e.target.value)}>
          <option value="">No Warehouse (Dashboard Only)</option>
          {warehouses.map(w => (
            <option key={w.id} value={w.id}>{w.name}</option>
          ))}
        </SelectInput>

        <div className={styles.actions}>
          <Button variant="outline" onClick={onClose} type="button">Cancel</Button>
          <Button variant="primary" type="submit" isLoading={loading}>Save Changes</Button>
        </div>
      </form>
    </Modal>
  );
};
