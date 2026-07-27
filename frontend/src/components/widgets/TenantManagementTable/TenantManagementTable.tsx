import React from 'react';
import { useTranslation } from 'react-i18next';
import styles from './TenantManagementTable.module.css';
import { Building2, MoreVertical } from 'lucide-react';
import { DataTable } from '../../ui/DataTable';
import type { DataTableColumn } from '../../ui/DataTable';
import { useDateFormat } from '../../../hooks/useDateFormat';

export interface Tenant {
  id: string;
  name: string;
  urlSlug: string;
  createdAt: string;
}

interface TenantManagementTableProps {
  tenants: Tenant[];
  isLoading?: boolean;
}

export const TenantManagementTable: React.FC<TenantManagementTableProps> = ({ tenants, isLoading }) => {
  const dates = useDateFormat();
  const { t } = useTranslation('dashboard');
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
      REMOVED: "Plan" and "Status" columns. Both rendered the not-set dash on
      every row because the Tenant model tracks neither — so the console's
      tenant table gave two full columns of table width to values that could
      never arrive. Removed for the same reason as the client list's Recent
      Activity column: a header is a promise of a per-row value, and a
      permanently empty one is worse than an absent one. Reinstate alongside
      the billing/subscription fields they would read from. TD-020.
    */
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
      render: () => (
        <button
          className={styles.actionButton}
          disabled
          title={t('superAdmin.tenantActionsSoon')}
          aria-label={t('superAdmin.tenantActionsAria')}
        >
          <MoreVertical size={16} />
        </button>
      ),
    },
  ];

  return (
    <div className={styles.tableContainer}>
      <div className={styles.header}>
        <h2 className={styles.title}>{t('superAdmin.tenantManagement')}</h2>
        <button className={styles.viewAllButton} disabled title={t('superAdmin.tenantDetailSoon')}>{t('superAdmin.viewAllTenants')}</button>
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
        <span className={styles.footerText}>{t('superAdmin.showingTenants', { count: tenants.length })}</span>
      </div>
    </div>
  );
};
