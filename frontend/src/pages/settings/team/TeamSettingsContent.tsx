import React, { useEffect, useState } from 'react';
import { Card } from '../../../components/ui/Card/Card';
import { ConfirmDialog } from '../../../components/ui/ConfirmDialog';
import { Button } from '../../../components/ui/Button/Button';
import { useTeam, type StaffMember } from '../../../hooks/useTeam';
import { InviteMemberModal } from './InviteMemberModal';
import { EditMemberModal } from './EditMemberModal';
import { Mail, Shield, Clock, Edit2, Trash2, UserMinus } from 'lucide-react';
import { useAuthStore } from '../../../store/useAuthStore';
import styles from './TeamSettingsContent.module.css';

export const TeamSettingsContent: React.FC = () => {
  const { staff, pendingInvitations, loadingStaff, loadingInvitations, fetchStaff, fetchPendingInvitations, inviteStaff, updateStaffRole, cancelInvitation, fetchDeactivationImpact, deactivateStaff } = useTeam();
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<StaffMember | null>(null);
  const [memberToDeactivate, setMemberToDeactivate] = useState<StaffMember | null>(null);
  const [impact, setImpact] = useState<{ clients: number; upcomingAppointments: number } | null>(null);

  const openDeactivateDialog = async (member: StaffMember) => {
    setMemberToDeactivate(member);
    setImpact(null);
    try {
      setImpact(await fetchDeactivationImpact(member.id));
    } catch {
      // The counts are advisory; if they cannot be loaded the dialog still
      // works, it just omits the "still holds" line rather than blocking.
    }
  };
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
                    <>
                      <Button variant="outline" onClick={() => setEditingMember(member)} className={styles.iconButton}>
                        <Edit2 size={14} />
                      </Button>
                      {/* A Business Owner cannot be deactivated, and nobody can
                          deactivate themselves — both enforced server-side too. */}
                      {member.role !== 'BUSINESS_OWNER' && member.id !== user?.userId && (
                        <Button
                          variant="outline"
                          onClick={() => openDeactivateDialog(member)}
                          className={styles.iconButton}
                          aria-label={`Deactivate ${member.email}`}
                        >
                          <UserMinus size={14} />
                        </Button>
                      )}
                    </>
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

      <ConfirmDialog
        isOpen={!!memberToDeactivate}
        onClose={() => {
          setMemberToDeactivate(null);
          setImpact(null);
        }}
        onConfirm={async () => {
          if (memberToDeactivate) await deactivateStaff(memberToDeactivate.id);
        }}
        title="Deactivate team member?"
        confirmLabel="Deactivate"
        tone="danger"
        message={
          <>
            <p>
              {memberToDeactivate?.firstName || memberToDeactivate?.email} will no longer be
              able to sign in. Their account and history are kept, not deleted.
            </p>

            {impact && (impact.clients > 0 || impact.upcomingAppointments > 0) && (
              <p>
                They are still assigned{' '}
                {impact.clients > 0 && (
                  <strong>
                    {impact.clients} client{impact.clients === 1 ? '' : 's'}
                  </strong>
                )}
                {impact.clients > 0 && impact.upcomingAppointments > 0 && ' and '}
                {impact.upcomingAppointments > 0 && (
                  <strong>
                    {impact.upcomingAppointments} upcoming appointment
                    {impact.upcomingAppointments === 1 ? '' : 's'}
                  </strong>
                )}
                . These stay assigned to them until you reassign them.
              </p>
            )}

            {/*
              Stated plainly rather than implying instant lockout: the auth
              middleware only verifies the token signature and never re-reads
              the user, so an active session survives until the token expires.
              See TD-010.
            */}
            <p>
              If they are signed in right now, their session ends the next time the
              app reloads, and within an hour at the latest.
            </p>
          </>
        }
      />
    </div>
  );
};
