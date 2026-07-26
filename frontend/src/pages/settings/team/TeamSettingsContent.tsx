import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation('settings');
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
    if (window.confirm(t('team.confirmCancelInvitation'))) {
      await cancelInvitation(invitationId);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h2 className={styles.headerTitle}>{t('team.title')}</h2>
          <p className={styles.headerSubtitle}>{t('team.subtitle')}</p>
        </div>
        {isOwner && (
          <Button variant="primary" onClick={() => setIsInviteModalOpen(true)}>
            {t('team.inviteMember')}
          </Button>
        )}
      </div>

      <Card padding="md">
        <h3 className={styles.cardTitle}>{t('team.activeMembers')}</h3>
        {loadingStaff ? (
          <p className={styles.mutedText}>{t('team.loadingMembers')}</p>
        ) : staff.length === 0 ? (
          <p className={styles.mutedText}>{t('team.noMembers')}</p>
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
                    {t(`team.roles.${member.role}`, { defaultValue: member.role })}
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
                          aria-label={t('team.deactivateAria', { email: member.email })}
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
          <h3 className={styles.cardTitle}>{t('team.pendingInvitations')}</h3>
          {loadingInvitations ? (
            <p className={styles.mutedText}>{t('team.loadingInvitations')}</p>
          ) : pendingInvitations.length === 0 ? (
            <p className={styles.mutedText}>{t('team.noInvitations')}</p>
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
                        {t('team.expires', { date: new Date(inv.expiresAt).toLocaleDateString() })}
                      </div>
                    </div>
                  </div>
                  <div className={styles.rowRight}>
                    <div className={styles.roleBadge}>
                      <Shield size={14} />
                      {t(`team.roles.${inv.role}`, { defaultValue: inv.role })}
                    </div>
                    {isOwner && (
                      <Button
                        variant="outline"
                        onClick={() => handleCancelInvitation(inv.id)}
                        className={`${styles.iconButton} ${styles.dangerButton}`}
                        title={t('team.cancelInvitation')}
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
        title={t('team.deactivate.title')}
        confirmLabel={t('team.deactivate.confirm')}
        tone="danger"
        message={
          <>
            <p>
              {t('team.deactivate.intro', {
                name: memberToDeactivate?.firstName || memberToDeactivate?.email,
              })}
            </p>

            {impact && (impact.clients > 0 || impact.upcomingAppointments > 0) && (
              <p>
                {t('team.deactivate.stillAssignedPrefix')}
                {/* Counts go through i18next plurals rather than a `=== 1 ? '' : 's'`
                    ternary, which only ever produced English plurals. */}
                {impact.clients > 0 && (
                  <strong>{t('team.deactivate.clients', { count: impact.clients })}</strong>
                )}
                {impact.clients > 0 && impact.upcomingAppointments > 0 && t('team.deactivate.and')}
                {impact.upcomingAppointments > 0 && (
                  <strong>
                    {t('team.deactivate.appointments', { count: impact.upcomingAppointments })}
                  </strong>
                )}
                {t('team.deactivate.stillAssignedSuffix')}
              </p>
            )}

            {/*
              Stated plainly rather than implying instant lockout: the auth
              middleware only verifies the token signature and never re-reads
              the user, so an active session survives until the token expires.
              See TD-010.
            */}
            <p>{t('team.deactivate.residualAccess')}</p>
          </>
        }
      />
    </div>
  );
};
