import React, { useEffect, useState } from 'react';
import { Card } from '../../../components/ui/Card/Card';
import { Button } from '../../../components/ui/Button/Button';
import { useTeam, StaffMember } from '../../../hooks/useTeam';
import { InviteMemberModal } from './InviteMemberModal';
import { EditMemberModal } from './EditMemberModal';
import { Mail, Shield, Clock, Edit2 } from 'lucide-react';
import { useAuthStore } from '../../../store/useAuthStore';

export const TeamSettingsContent: React.FC = () => {
  const { staff, pendingInvitations, loadingStaff, loadingInvitations, fetchStaff, fetchPendingInvitations, inviteStaff, updateStaffRole } = useTeam();
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<StaffMember | null>(null);
  const { user } = useAuthStore();
  const isOwner = user?.role === 'BUSINESS_OWNER' || user?.role === 'SUPER_ADMIN';

  useEffect(() => {
    fetchStaff();
    fetchPendingInvitations();
  }, [fetchStaff, fetchPendingInvitations]);

  const handleInvite = async (email: string, role: string, warehouseId?: string) => {
    await inviteStaff(email, role, warehouseId);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-lg)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontFamily: 'var(--font-family-headline-sm)', fontSize: 'var(--font-size-headline-sm)', color: 'var(--color-on-surface)', margin: 0 }}>Team Members</h2>
          <p style={{ fontFamily: 'var(--font-family-body-md)', fontSize: 'var(--font-size-body-md)', color: 'var(--color-on-surface-variant)', margin: 'var(--spacing-xs) 0 0 0' }}>
            Manage your team, their roles, and pending invitations.
          </p>
        </div>
        {isOwner && (
          <Button variant="primary" onClick={() => setIsInviteModalOpen(true)}>
            Invite Member
          </Button>
        )}
      </div>

      <Card padding="md">
        <h3 style={{ margin: '0 0 16px 0', fontSize: '18px' }}>Active Members</h3>
        {loadingStaff ? (
          <p>Loading members...</p>
        ) : staff.length === 0 ? (
          <p style={{ color: 'var(--color-on-surface-variant)' }}>No active staff members found.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {staff.map((member) => (
              <div key={member.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', border: '1px solid var(--color-outline-variant)', borderRadius: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'var(--color-primary-container)', color: 'var(--color-on-primary-container)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                    {member.firstName ? member.firstName[0] : member.email[0].toUpperCase()}
                  </div>
                  <div>
                    <div style={{ fontWeight: 600 }}>{member.firstName} {member.lastName}</div>
                    <div style={{ fontSize: '14px', color: 'var(--color-on-surface-variant)' }}>{member.email}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: 'var(--color-surface-container-highest)', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 500 }}>
                    <Shield size={14} />
                    {member.role === 'STAFF' ? 'Sales Rep' : member.role}
                  </div>
                  {isOwner && (
                    <Button variant="outline" size="sm" onClick={() => setEditingMember(member)} style={{ padding: '4px 8px' }}>
                      <Edit2 size={14} />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {isOwner && (
        <Card padding="md">
          <h3 style={{ margin: '0 0 16px 0', fontSize: '18px' }}>Pending Invitations</h3>
          {loadingInvitations ? (
            <p>Loading invitations...</p>
          ) : pendingInvitations.length === 0 ? (
            <p style={{ color: 'var(--color-on-surface-variant)' }}>No pending invitations.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {pendingInvitations.map((inv) => (
                <div key={inv.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', border: '1px solid var(--color-outline-variant)', borderRadius: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'var(--color-surface-variant)', color: 'var(--color-on-surface-variant)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Mail size={20} />
                    </div>
                    <div>
                      <div style={{ fontWeight: 600 }}>{inv.email}</div>
                      <div style={{ fontSize: '12px', color: 'var(--color-on-surface-variant)', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
                        <Clock size={12} />
                        Expires {new Date(inv.expiresAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: 'var(--color-surface-container-highest)', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 500 }}>
                    <Shield size={14} />
                    {inv.role === 'STAFF' ? 'Sales Rep' : inv.role}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      <InviteMemberModal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        onInvite={handleInvite}
      />
      
      <EditMemberModal
        member={editingMember}
        onClose={() => setEditingMember(null)}
        onUpdate={updateStaffRole}
      />
    </div>
  );
};
