import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus } from 'lucide-react';
import { Button } from '../../components/ui/Button/Button';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { TenantManagementTable } from '../../components/widgets/TenantManagementTable';
import { CreateTenantModal } from './CreateTenantModal';
import { useTenants, useTenantAdmin } from '../../hooks/useDashboard';
import type { CreateTenantInput, Tenant } from '../../services/dashboardService';
import styles from './TenantsPage.module.css';

/**
 * The Super Admin's tenant console.
 *
 * This page is the reason TD-008 could finally be closed: the platform shell
 * had six dead sidebar links and only one working route, because SUPER_ADMIN is
 * correctly forbidden from every tenant-scoped page. There was nothing else for
 * it to point at until these actions existed.
 */
export const TenantsPage = () => {
  const { t } = useTranslation('dashboard');
  const { tenants, total, isLoading, fetchTenants } = useTenants();
  const { createTenant, suspendTenant, reactivateTenant, isSubmitting, error, clearError } =
    useTenantAdmin();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<{
    tenant: Tenant;
    kind: 'suspend' | 'reactivate';
  } | null>(null);

  const refresh = () => fetchTenants(0, 50);

  const handleCreate = async (input: CreateTenantInput): Promise<boolean> => {
    const created = await createTenant(input);
    if (!created) return false;
    refresh();
    return true;
  };

  const handleConfirmAction = async () => {
    if (!pendingAction) return;
    const { tenant, kind } = pendingAction;
    const result =
      kind === 'suspend' ? await suspendTenant(tenant.id) : await reactivateTenant(tenant.id);

    // ConfirmDialog stays open when onConfirm rejects, so a failure has to
    // throw rather than resolve quietly — otherwise the dialog closes over an
    // unchanged list with no explanation.
    if (!result) throw new Error(error ?? 'Action failed');

    setPendingAction(null);
    refresh();
  };

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>{t('superAdmin.tenantsTitle')}</h1>
          <p className={styles.subtitle}>{t('superAdmin.tenantsSubtitle', { count: total })}</p>
        </div>
        <Button
          icon={<Plus size={20} />}
          onClick={() => {
            clearError();
            setIsCreateOpen(true);
          }}
        >
          {t('superAdmin.newTenant')}
        </Button>
      </header>

      {error && !isCreateOpen && !pendingAction && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}

      <TenantManagementTable
        tenants={tenants}
        isLoading={isLoading}
        pendingTenantId={isSubmitting ? pendingAction?.tenant.id ?? null : null}
        onSuspend={(tenant) => {
          clearError();
          setPendingAction({ tenant, kind: 'suspend' });
        }}
        onReactivate={(tenant) => {
          clearError();
          setPendingAction({ tenant, kind: 'reactivate' });
        }}
      />

      <CreateTenantModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSubmit={handleCreate}
        isSubmitting={isSubmitting}
        serverError={error}
      />

      <ConfirmDialog
        isOpen={pendingAction !== null}
        onClose={() => setPendingAction(null)}
        onConfirm={handleConfirmAction}
        // Suspension is styled as destructive because of its blast radius —
        // an entire workspace loses access immediately — but it deletes
        // nothing, and the message says so rather than leaving the operator to
        // guess how reversible it is.
        tone={pendingAction?.kind === 'suspend' ? 'danger' : 'primary'}
        title={
          pendingAction?.kind === 'suspend'
            ? t('superAdmin.confirmSuspendTitle')
            : t('superAdmin.confirmReactivateTitle')
        }
        message={
          pendingAction?.kind === 'suspend'
            ? t('superAdmin.confirmSuspendMessage', { name: pendingAction?.tenant.name })
            : t('superAdmin.confirmReactivateMessage', { name: pendingAction?.tenant.name })
        }
        confirmLabel={
          pendingAction?.kind === 'suspend'
            ? t('superAdmin.suspendTenant')
            : t('superAdmin.reactivateTenant')
        }
      />
    </div>
  );
};
