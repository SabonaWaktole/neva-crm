import React, { useState, useEffect } from 'react';
import { Card } from '../../../components/ui/Card/Card';
import { Button } from '../../../components/ui/Button/Button';
import { useWarehouses } from '../../../hooks/useWarehouses';
import type { StaffMember } from '../../../hooks/useTeam';

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

  if (!member) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center',
      justifyContent: 'center', zIndex: 1000
    }}>
      <Card padding="lg" style={{ width: '400px', backgroundColor: 'var(--color-surface)' }}>
        <h2 style={{ margin: '0 0 16px 0' }}>Edit Team Member</h2>
        <div style={{ marginBottom: '16px', color: 'var(--color-on-surface-variant)' }}>
          Editing {member.email}
        </div>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 500 }}>Role</label>
            <select 
              value={role}
              onChange={(e) => setRole(e.target.value)}
              style={{
                width: '100%', padding: '10px', borderRadius: '6px',
                border: '1px solid var(--color-outline)',
                backgroundColor: 'var(--color-surface-container-highest)',
                color: 'var(--color-on-surface)'
              }}>
              <option value="STAFF">Staff (Sales Representative)</option>
              <option value="BUSINESS_OWNER">Business Owner</option>
            </select>
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 500 }}>Assign Warehouse</label>
            <select 
              value={warehouseId}
              onChange={(e) => setWarehouseId(e.target.value)}
              style={{
                width: '100%', padding: '10px', borderRadius: '6px',
                border: '1px solid var(--color-outline)',
                backgroundColor: 'var(--color-surface-container-highest)',
                color: 'var(--color-on-surface)'
              }}>
              <option value="">No Warehouse (Dashboard Only)</option>
              {warehouses.map(w => (
                <option key={w.id} value={w.id}>{w.name}</option>
              ))}
            </select>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '16px' }}>
            <Button variant="outline" onClick={onClose} type="button">Cancel</Button>
            <Button variant="primary" type="submit" isLoading={loading}>Save Changes</Button>
          </div>
        </form>
      </Card>
    </div>
  );
};
