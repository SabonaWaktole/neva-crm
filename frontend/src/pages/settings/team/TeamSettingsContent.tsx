import React, { useEffect, useState } from 'react';
import { Card } from '../../../components/ui/Card/Card';
import { Button } from '../../../components/ui/Button/Button';
import { useTeam, type StaffMember } from '../../../hooks/useTeam';
import { InviteMemberModal } from './InviteMemberModal';
import { EditMemberModal } from './EditMemberModal';
import { Mail, Shield, Clock, Edit2, Trash2 } from 'lucide-react';
import { useAuthStore } from '../../../store/useAuthStore';
import styles from './TeamSettingsContent.module.css';

export const TeamSettingsContent: React.FC = () => {
  const { staff, pendingInvitations, loadingStaff, loadingInvitations, fetchStaff, fetchPendingInvitations, inviteStaff, updateStaffRole, cancelInvitation } = useTeam();
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

  const handleCancelInvitation = async (invitationId: string) => {
    if (window.confirm('Are you sure you want to cancel this invitation?')) {
      await cancelInvitation(invitationId);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h2 className={styles.headerTitle}>Team Members</h2>
          <p className={styles.headerSubtitle}>
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
        <h3 className={styles.cardTitle}>Active Members</h3>
        {loadingStaff ? (
          <p className={styles.mutedText}>Loading members...</p>
        ) : staff.length === 0 ? (
          <p className={styles.mutedText}>No active staff members found.</p>
        ) : (
          <div className={styles.list}>
            {staff.map((member) => (
              <div key={member.id} className={styles.row}>
                <div className={styles.rowLeft}>
                  <div className={styles.avatar}>
                    {member.firstName ? member.firstName[0] : member.email[0].toUpperCase()}
                  </div>
                  <div className={styles.memberInfo}>
                    <div className={styles.memberName}>{member.firstName} {member.lastName}</div>
                    <div className={styles.memberEmail}>{member.email}</div>
                  </div>
                </div>
                <div className={styles.rowRight}>
                  <div className={styles.roleBadge}>
                    <Shield size={14} />
                    {member.role === 'STAFF' ? 'Sales Rep' : member.role}
                  </div>
                  {isOwner && (
                    <Button variant="outline" onClick={() => setEditingMember(member)} className={styles.iconButton}>
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
          <h3 className={styles.cardTitle}>Pending Invitations</h3>
          {loadingInvitations ? (
            <p className={styles.mutedText}>Loading invitations...</p>
          ) : pendingInvitations.length === 0 ? (
            <p className={styles.mutedText}>No pending invitations.</p>
          ) : (
            <div className={styles.list}>
              {pendingInvitations.map((inv) => (
                <div key={inv.id} className={styles.row}>
                  <div className={styles.rowLeft}>
                    <div className={`${styles.avatar} ${styles.avatarNeutral}`}>
                      <Mail size={20} />
                    </div>
                    <div className={styles.memberInfo}>
                      <div className={styles.memberName}>{inv.email}</div>
                      <div className={styles.memberExpiry}>
                        <Clock size={12} />
                        Expires {new Date(inv.expiresAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  <div className={styles.rowRight}>
                    <div className={styles.roleBadge}>
                      <Shield size={14} />
                      {inv.role === 'STAFF' ? 'Sales Rep' : inv.role}
                    </div>
                    {isOwner && (
                      <Button
                        variant="outline"
                        onClick={() => handleCancelInvitation(inv.id)}
                        className={`${styles.iconButton} ${styles.dangerButton}`}
                        title="Cancel Invitation"
                      >
                        <Trash2 size={14} />
                      </Button>
                    )}
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
