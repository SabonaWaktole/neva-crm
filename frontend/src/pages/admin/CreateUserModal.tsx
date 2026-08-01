import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button/Button';
import { TextInput } from '../../components/ui/TextInput';
import { SelectInput } from '../../components/ui/SelectInput';
// Explicit path: PasswordInput has no index.ts, unlike its siblings here.
import { PasswordInput } from '../../components/ui/PasswordInput/PasswordInput';
import type { CreatePlatformUserInput, Tenant } from '../../services/dashboardService';
import styles from './CreateTenantModal.module.css';

interface CreateUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Workspaces the account can be created in. */
  tenants: Tenant[];
  onSubmit: (tenantId: string, input: CreatePlatformUserInput) => Promise<boolean>;
  isSubmitting: boolean;
  serverError: string | null;
}

interface FormValues extends CreatePlatformUserInput {
  tenantId: string;
}

const EMPTY: FormValues = {
  tenantId: '',
  email: '',
  password: '',
  role: 'STAFF',
  firstName: '',
  lastName: '',
};

/**
 * Creating an account with its password already set.
 *
 * The workspace is a field here, unlike everywhere else in the app, because the
 * platform console operates across all of them. `SUPER_ADMIN` is not offered as
 * a role: the platform role belongs to no workspace, so "create one in this
 * tenant" is not a coherent request — the server refuses it too.
 *
 * The validation below mirrors `tenantSchemas.createUser`, which is the
 * authority. This exists to catch mistakes before a round trip.
 */
export const CreateUserModal: React.FC<CreateUserModalProps> = ({
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

  // A modal reopened after a previous submission must not still hold the last
  // person's details — least of all their password.
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

  const validate = (): boolean => {
    const found: Partial<Record<keyof FormValues, string>> = {};

    if (!values.tenantId) found.tenantId = t('superAdmin.errWorkspaceRequired');

    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(values.email))
      found.email = t('superAdmin.errEmailFormat');

    const pwd = values.password;
    if (pwd.length < 8 || !/[A-Z]/.test(pwd) || !/[a-z]/.test(pwd) || !/[0-9]/.test(pwd))
      found.password = t('superAdmin.errPasswordRules');

    setErrors(found);
    return Object.keys(found).length === 0;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!validate()) return;

    const { tenantId, ...input } = values;
    const created = await onSubmit(tenantId, {
      ...input,
      // Empty strings are "not provided", not a name of zero characters.
      firstName: input.firstName?.trim() || null,
      lastName: input.lastName?.trim() || null,
    });
    if (created) onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={t('superAdmin.createUserTitle')}>
      <form className={styles.form} onSubmit={handleSubmit} noValidate>
        <p className={styles.intro}>{t('superAdmin.createUserIntro')}</p>

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
          helperText={t('superAdmin.fieldRoleHelp')}
          required
        >
          <option value="STAFF">{t('superAdmin.roleStaff')}</option>
          <option value="BUSINESS_OWNER">{t('superAdmin.roleBusinessOwner')}</option>
        </SelectInput>

        <TextInput
          label={t('superAdmin.fieldFirstName')}
          value={values.firstName ?? ''}
          onChange={(e) => set('firstName')(e.target.value)}
        />

        <TextInput
          label={t('superAdmin.fieldLastName')}
          value={values.lastName ?? ''}
          onChange={(e) => set('lastName')(e.target.value)}
        />

        <TextInput
          label={t('superAdmin.fieldUserEmail')}
          type="email"
          value={values.email}
          onChange={(e) => set('email')(e.target.value)}
          error={errors.email}
          required
        />

        <PasswordInput
          label={t('superAdmin.fieldUserPassword')}
          value={values.password}
          onChange={(e) => set('password')(e.target.value)}
          error={errors.password}
          helperText={t('superAdmin.fieldUserPasswordHelp')}
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
            {isSubmitting ? t('superAdmin.creating') : t('superAdmin.createUserSubmit')}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
