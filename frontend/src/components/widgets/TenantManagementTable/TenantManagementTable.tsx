import React from 'react';
import { useTranslation } from 'react-i18next';
import styles from './TenantManagementTable.module.css';
import { Building2, MoreVertical, Ban, CheckCircle2 } from 'lucide-react';
import { DataTable } from '../../ui/DataTable';
import type { DataTableColumn } from '../../ui/DataTable';
import { Badge } from '../../ui/Badge';
import { DropdownMenu } from '../../ui/DropdownMenu';
import { useDateFormat } from '../../../hooks/useDateFormat';
import type { Tenant } from '../../../services/dashboardService';

export type { Tenant };

interface TenantManagementTableProps {
  tenants: Tenant[];
  isLoading?: boolean;
  /** Omit to render the table read-only, as the dashboard summary does. */
  onSuspend?: (tenant: Tenant) => void;
  onReactivate?: (tenant: Tenant) => void;
  /** Rendered as a header action when provided. */
  onViewAll?: () => void;
  /** The tenant whose action is in flight, so only its row shows as busy. */
  pendingTenantId?: string | null;
}

export const TenantManagementTable: React.FC<TenantManagementTableProps> = ({
  tenants,
  isLoading,
  onSuspend,
  onReactivate,
  onViewAll,
  pendingTenantId,
}) => {
  const dates = useDateFormat();
  const { t } = useTranslation('dashboard');

  const canAct = Boolean(onSuspend && onReactivate);

  const columns: DataTableColumn<Tenant>[] = [
    {
      id: 'organization',
      header: t('superAdmin.columnOrganization'),
      cardLabel: null,
      render: (tenant) => (
        <div className={styles.orgCell}>
          <div className={styles.avatar}>{tenant.name.substring(0, 2).toUpperCase()}</div>
          <div className={styles.orgDetails}>
            <span className={styles.orgName}>{tenant.name}</span>
            <span className={styles.orgSlug}>{tenant.urlSlug}</span>
          </div>
        </div>
      ),
    },
    /*
      The Status column is back. It was removed under TD-020 along with "Plan"
      because the Tenant model tracked neither, so both rendered the not-set
      dash on every row — a header is a promise of a per-row value, and a
      permanently empty one is worse than an absent one. That comment named its
      own precondition: reinstate alongside the field it would read from.
      `subscriptionStatus` is now that field.

      "Plan" stays removed. Billing is still unmodelled, so it would be exactly
      the empty column it was before. TD-020 remains open for it.
    */
    {
      id: 'status',
      header: t('superAdmin.columnStatus'),
      nowrap: true,
      render: (tenant) =>
        tenant.subscriptionStatus === 'SUSPENDED' ? (
          <Badge variant="error">{t('superAdmin.statusSuspended')}</Badge>
        ) : (
          <Badge variant="success">{t('superAdmin.statusActive')}</Badge>
        ),
    },
    {
      id: 'joined',
      header: t('superAdmin.columnDateJoined'),
      nowrap: true,
      render: (tenant) => (
        <span className={styles.dateCell}>
          {dates.custom(tenant.createdAt, {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
          })}
        </span>
      ),
    },
    {
      id: 'actions',
      header: '',
      align: 'right',
      width: '64px',
      cardLabel: null,
      render: (tenant) => {
        if (!canAct) {
          // Read-only mode: no menu at all rather than a disabled button
          // promising options that are not coming on this screen.
          return null;
        }

        const isSuspended = tenant.subscriptionStatus === 'SUSPENDED';
        const isPending = pendingTenantId === tenant.id;

        return (
          <DropdownMenu
            align="right"
            trigger={
              <button
                className={styles.actionButton}
                disabled={isPending}
                aria-label={t('superAdmin.tenantActionsFor', { name: tenant.name })}
              >
                <MoreVertical size={16} />
              </button>
            }
            items={[
              isSuspended
                ? {
                    id: 'reactivate',
                    label: t('superAdmin.reactivateTenant'),
                    icon: <CheckCircle2 size={16} />,
                    onClick: () => onReactivate!(tenant),
                    disabled: isPending,
                  }
                : {
                    id: 'suspend',
                    label: t('superAdmin.suspendTenant'),
                    icon: <Ban size={16} />,
                    // Suspension cuts off a whole workspace, so it is styled as
                    // the destructive option even though it destroys nothing.
                    danger: true,
                    onClick: () => onSuspend!(tenant),
                    disabled: isPending,
                  },
            ]}
          />
        );
      },
    },
  ];

  return (
    <div className={styles.tableContainer}>
      <div className={styles.header}>
        <h2 className={styles.title}>{t('superAdmin.tenantManagement')}</h2>
        {onViewAll && (
          <button className={styles.viewAllButton} onClick={onViewAll}>
            {t('superAdmin.viewAllTenants')}
          </button>
        )}
      </div>

      <DataTable
        columns={columns}
        rows={tenants}
        rowKey={(tenant) => tenant.id}
        isLoading={isLoading}
        caption={t('superAdmin.tableCaption')}
        className={styles.table}
        empty={{
          icon: <Building2 size={20} />,
          title: t('superAdmin.emptyTitle'),
          description: t('superAdmin.emptyDescription'),
        }}
      />

      <div className={styles.footer}>
        <span className={styles.footerText}>
          {t('superAdmin.showingTenants', { count: tenants.length })}
        </span>
      </div>
    </div>
  );
};
