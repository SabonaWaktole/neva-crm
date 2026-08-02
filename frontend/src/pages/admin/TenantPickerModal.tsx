import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button/Button';
import { TextInput } from '../../components/ui/TextInput';
import type { Tenant } from '../../services/dashboardService';
import styles from './TenantPickerModal.module.css';

interface TenantPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  tenants: Tenant[];
  isLoading?: boolean;
  /** The selection as it stood when the modal opened. */
  initialSelectedIds: string[];
  /** Fires only on "Apply" — closing without it leaves the prior selection untouched. */
  onApply: (tenantIds: string[]) => void;
}

/**
 * Choosing which workspaces a settings change applies to.
 *
 * A local draft selection, committed only on "Apply" — closing the modal any
 * other way (the X button, Escape, the backdrop) discards it. That matters
 * here specifically: this selection decides where a write lands, and a stray
 * click closing the modal must not silently change what "Selected Tenants"
 * means on the page behind it.
 */
export const TenantPickerModal: React.FC<TenantPickerModalProps> = ({
  isOpen,
  onClose,
  tenants,
  isLoading,
  initialSelectedIds,
  onApply,
}) => {
  const { t } = useTranslation('dashboard');
  const [draft, setDraft] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (isOpen) {
      setDraft(new Set(initialSelectedIds));
      setSearch('');
    }
  }, [isOpen, initialSelectedIds]);

  const toggle = (id: string) => {
    setDraft((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const filtered = tenants.filter(
    (t) =>
      !search.trim() ||
      t.name.toLowerCase().includes(search.trim().toLowerCase()) ||
      t.urlSlug.toLowerCase().includes(search.trim().toLowerCase())
  );

  const allFilteredSelected = filtered.length > 0 && filtered.every((t) => draft.has(t.id));

  const toggleAllFiltered = () => {
    setDraft((prev) => {
      const next = new Set(prev);
      if (allFilteredSelected) {
        filtered.forEach((t) => next.delete(t.id));
      } else {
        filtered.forEach((t) => next.add(t.id));
      }
      return next;
    });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={t('superAdmin.selectTenantsTitle')} maxWidth="lg">
      <div className={styles.container}>
        <TextInput
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t('superAdmin.selectTenantsSearchPlaceholder')}
          aria-label={t('superAdmin.selectTenantsSearchPlaceholder')}
          autoFocus
        />

        <div className={styles.listHeader}>
          <label className={styles.checkboxRow}>
            <input
              type="checkbox"
              checked={allFilteredSelected}
              onChange={toggleAllFiltered}
              disabled={filtered.length === 0}
            />
            <span>{t('superAdmin.selectAllVisible')}</span>
          </label>
          <span className={styles.countText}>
            {t('superAdmin.selectedCount', { count: draft.size })}
          </span>
        </div>

        <div className={styles.list} role="listbox" aria-multiselectable="true">
          {isLoading && <p className={styles.emptyText}>{t('superAdmin.loadingTenants')}</p>}
          {!isLoading && filtered.length === 0 && (
            <p className={styles.emptyText}>{t('superAdmin.noTenantsMatch')}</p>
          )}
          {filtered.map((tenant) => {
            const suspended = tenant.subscriptionStatus === 'SUSPENDED';
            return (
              <label key={tenant.id} className={styles.checkboxRow}>
                <input
                  type="checkbox"
                  checked={draft.has(tenant.id)}
                  onChange={() => toggle(tenant.id)}
                />
                <span className={styles.tenantName}>{tenant.name}</span>
                <span className={styles.tenantSlug}>{tenant.urlSlug}</span>
                {suspended && (
                  <span className={styles.suspendedBadge}>{t('superAdmin.statusSuspended')}</span>
                )}
              </label>
            );
          })}
        </div>

        <div className={styles.actions}>
          <Button type="button" variant="ghost" onClick={onClose}>
            {t('superAdmin.cancel')}
          </Button>
          <Button type="button" onClick={() => onApply([...draft])}>
            {t('superAdmin.applySelection', { count: draft.size })}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
