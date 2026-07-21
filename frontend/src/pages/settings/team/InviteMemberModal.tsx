import React, { useState } from 'react';
import { Card } from '../../../components/ui/Card/Card';
import { Button } from '../../../components/ui/Button/Button';

interface InviteMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInvite: (email: string) => Promise<void>;
}

export const InviteMemberModal: React.FC<InviteMemberModalProps> = ({
  isOpen,
  onClose,
  onInvite
}) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    try {
      await onInvite(email);
      onClose();
      setEmail('');
    } catch (err) {
      console.error(err);
      alert('Failed to send invitation');
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
        <h2 style={{ margin: '0 0 16px 0' }}>Invite Team Member</h2>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 500 }}>Email Address</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="colleague@example.com"
              style={{
                width: '100%', padding: '10px', borderRadius: '6px',
                border: '1px solid var(--color-outline)',
                backgroundColor: 'var(--color-surface-container-highest)',
                color: 'var(--color-on-surface)'
              }}
              required
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 500 }}>Role</label>
            <select disabled style={{
                width: '100%', padding: '10px', borderRadius: '6px',
                border: '1px solid var(--color-outline)',
                backgroundColor: 'var(--color-surface-container-highest)',
                color: 'var(--color-on-surface-variant)'
              }}>
              <option value="STAFF">Staff (Sales Representative)</option>
            </select>
            <p style={{ fontSize: '12px', color: 'var(--color-on-surface-variant)', marginTop: '4px' }}>
              Only STAFF role is supported for invitations at this time.
            </p>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '16px' }}>
            <Button variant="outline" onClick={onClose} type="button">Cancel</Button>
            <Button variant="primary" type="submit" isLoading={loading}>Send Invitation</Button>
          </div>
        </form>
      </Card>
    </div>
  );
};
