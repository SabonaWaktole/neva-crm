import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button/Button';
import { TextInput } from '../../components/ui/TextInput';
import { SelectInput } from '../../components/ui/SelectInput';
import type { InvitePlatformUserInput, Tenant } from '../../services/dashboardService';
import styles from './CreateTenantModal.module.css';

interface InviteUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Workspaces the invitee can be invited into. */
  tenants: Tenant[];
  onSubmit: (tenantId: string, input: InvitePlatformUserInput) => Promise<boolean>;
  isSubmitting: boolean;
  serverError: string | null;
}

interface FormValues extends InvitePlatformUserInput {
  tenantId: string;
}

const EMPTY: FormValues = { tenantId: '', email: '', role: 'BUSINESS_OWNER' };

/**
 * Inviting someone into a workspace from the platform console — the third way
 * a person becomes a Business Owner, alongside being promoted from staff and
 * being invited by an owner already in the workspace.
 *
 * The role defaults to Business Owner because that is what this exists for,
 * and the invitation ADDS one: a workspace may have several owners, so nobody
 * currently holding the role is displaced.
 *
 * Sibling of `CreateUserModal`, not a replacement: that one provisions an
 * account with a password the admin types and must then hand over securely.
 * This one sends a link and lets the recipient set their own, which is the
 * right shape for someone outside the platform.
 */
export const InviteUserModal: React.FC<InviteUserModalProps> = ({
  isOpen,
  onClose,
  tenants,
  onSubmit,
  isSubmitting,
  serverError,
}) => {
  const { t } = useTranslation('dashboard');
  const [values, setValues] = useState<FormValues>(EMPTY);
  const [errors, setErrors] = useState<Partial<Record<keyof FormValues, string>>>({});

  useEffect(() => {
    if (isOpen) {
      setValues({ ...EMPTY, tenantId: tenants[0]?.id ?? '' });
      setErrors({});
    }
  }, [isOpen, tenants]);

  const set = (field: keyof FormValues) => (value: string) => {
    setValues((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  // Mirrors `tenantSchemas.inviteUser`, which is the authority — this only
  // saves a round trip.
  const validate = (): boolean => {
    const found: Partial<Record<keyof FormValues, string>> = {};
    if (!values.tenantId) found.tenantId = t('superAdmin.errWorkspaceRequired');
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(values.email)) found.email = t('superAdmin.errEmailFormat');
    setErrors(found);
    return Object.keys(found).length === 0;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!validate()) return;

    const { tenantId, ...input } = values;
    const sent = await onSubmit(tenantId, { ...input, email: input.email.trim() });
    if (sent) onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={t('superAdmin.inviteUserTitle')}>
      <form className={styles.form} onSubmit={handleSubmit} noValidate>
        <p className={styles.intro}>{t('superAdmin.inviteUserIntro')}</p>

        <SelectInput
          label={t('superAdmin.fieldWorkspace')}
          value={values.tenantId}
          onChange={(e) => set('tenantId')(e.target.value)}
          error={errors.tenantId}
          required
        >
          {tenants.map((tenant) => (
            <option key={tenant.id} value={tenant.id}>
              {tenant.name}
            </option>
          ))}
        </SelectInput>

        <SelectInput
          label={t('superAdmin.fieldRole')}
          value={values.role}
          onChange={(e) => set('role')(e.target.value)}
          helperText={t('superAdmin.inviteRoleHelp')}
          required
        >
          <option value="BUSINESS_OWNER">{t('superAdmin.roleBusinessOwner')}</option>
          <option value="STAFF">{t('superAdmin.roleStaff')}</option>
        </SelectInput>

        <TextInput
          label={t('superAdmin.fieldUserEmail')}
          type="email"
          value={values.email}
          onChange={(e) => set('email')(e.target.value)}
          error={errors.email}
          required
        />

        {serverError && (
          <p className={styles.serverError} role="alert">
            {serverError}
          </p>
        )}

        <div className={styles.actions}>
          <Button type="button" variant="ghost" onClick={onClose} disabled={isSubmitting}>
            {t('superAdmin.cancel')}
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? t('superAdmin.sendingInvite') : t('superAdmin.inviteUserSubmit')}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
