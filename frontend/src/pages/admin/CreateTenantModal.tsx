import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button/Button';
import { TextInput } from '../../components/ui/TextInput';
// Explicit path: PasswordInput has no index.ts, unlike its siblings here.
import { PasswordInput } from '../../components/ui/PasswordInput/PasswordInput';
import type { CreateTenantInput } from '../../services/dashboardService';
import styles from './CreateTenantModal.module.css';

interface CreateTenantModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (input: CreateTenantInput) => Promise<boolean>;
  isSubmitting: boolean;
  /** Server-side failure, e.g. a slug taken by another workspace. */
  serverError: string | null;
}

const EMPTY: CreateTenantInput = {
  companyName: '',
  urlSlug: '',
  ownerEmail: '',
  ownerPassword: '',
};

/**
 * Derives a URL slug from a company name.
 *
 * Only ever a starting suggestion — the field stays editable, and stops being
 * auto-filled the moment the admin edits it. Silently rewriting a value someone
 * typed is worse than a bad default.
 */
const slugify = (name: string) =>
  name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

/**
 * Super Admin provisioning a workspace on a business's behalf.
 *
 * The client-side rules below mirror `tenantSchemas.createTenant` on the
 * server, which is the authority — this exists to catch mistakes before a
 * round trip, not to be the check. The password rules in particular are the
 * same ones self-registration applies: an admin-set password is a real
 * credential the owner will log in with.
 */
export const CreateTenantModal: React.FC<CreateTenantModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  isSubmitting,
  serverError,
}) => {
  const { t } = useTranslation('dashboard');
  const [values, setValues] = useState<CreateTenantInput>(EMPTY);
  const [slugTouched, setSlugTouched] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof CreateTenantInput, string>>>({});

  // A modal reopened after a previous submission must not still hold the last
  // tenant's details.
  useEffect(() => {
    if (isOpen) {
      setValues(EMPTY);
      setSlugTouched(false);
      setErrors({});
    }
  }, [isOpen]);

  const set = (field: keyof CreateTenantInput) => (value: string) => {
    setValues((prev) => {
      const next = { ...prev, [field]: value };
      if (field === 'companyName' && !slugTouched) {
        next.urlSlug = slugify(value);
      }
      return next;
    });
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const validate = (): boolean => {
    const found: Partial<Record<keyof CreateTenantInput, string>> = {};

    if (!values.companyName.trim()) found.companyName = t('superAdmin.errCompanyRequired');

    if (!values.urlSlug.trim()) found.urlSlug = t('superAdmin.errSlugRequired');
    else if (!/^[a-z0-9-]+$/.test(values.urlSlug)) found.urlSlug = t('superAdmin.errSlugFormat');

    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(values.ownerEmail))
      found.ownerEmail = t('superAdmin.errEmailFormat');

    const pwd = values.ownerPassword;
    if (pwd.length < 8 || !/[A-Z]/.test(pwd) || !/[a-z]/.test(pwd) || !/[0-9]/.test(pwd))
      found.ownerPassword = t('superAdmin.errPasswordRules');

    setErrors(found);
    return Object.keys(found).length === 0;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!validate()) return;
    const created = await onSubmit(values);
    if (created) onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={t('superAdmin.createTenantTitle')}>
      <form className={styles.form} onSubmit={handleSubmit} noValidate>
        <p className={styles.intro}>{t('superAdmin.createTenantIntro')}</p>

        <TextInput
          label={t('superAdmin.fieldCompanyName')}
          value={values.companyName}
          onChange={(e) => set('companyName')(e.target.value)}
          error={errors.companyName}
          autoFocus
          required
        />

        <TextInput
          label={t('superAdmin.fieldUrlSlug')}
          value={values.urlSlug}
          onChange={(e) => {
            setSlugTouched(true);
            set('urlSlug')(e.target.value);
          }}
          error={errors.urlSlug}
          helperText={t('superAdmin.fieldUrlSlugHelp')}
          required
        />

        <TextInput
          label={t('superAdmin.fieldOwnerEmail')}
          type="email"
          value={values.ownerEmail}
          onChange={(e) => set('ownerEmail')(e.target.value)}
          error={errors.ownerEmail}
          helperText={t('superAdmin.fieldOwnerEmailHelp')}
          required
        />

        <PasswordInput
          label={t('superAdmin.fieldOwnerPassword')}
          value={values.ownerPassword}
          onChange={(e) => set('ownerPassword')(e.target.value)}
          error={errors.ownerPassword}
          helperText={t('superAdmin.fieldOwnerPasswordHelp')}
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
            {isSubmitting ? t('superAdmin.creating') : t('superAdmin.createTenantSubmit')}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
