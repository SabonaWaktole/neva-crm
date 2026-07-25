import React from 'react';
import styles from './TenantManagementTable.module.css';
import { Building2, MoreVertical } from 'lucide-react';
import { DataTable } from '../../ui/DataTable';
import type { DataTableColumn } from '../../ui/DataTable';

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
  const columns: DataTableColumn<Tenant>[] = [
    {
      id: 'organization',
      header: 'Organization',
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
    {
      id: 'plan',
      header: 'Plan',
      /* Honest placeholder for Plan since the backend doesn't track this yet */
      render: () => <span className={styles.placeholderText}>—</span>,
    },
    {
      id: 'status',
      header: 'Status',
      /* Honest placeholder for Status since the backend doesn't track this yet */
      render: () => <span className={styles.placeholderText}>—</span>,
    },
    {
      id: 'joined',
      header: 'Date Joined',
      nowrap: true,
      render: (tenant) => (
        <span className={styles.dateCell}>
          {new Date(tenant.createdAt).toLocaleDateString(undefined, {
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
          title="More options coming soon"
          aria-label="Tenant actions (coming soon)"
        >
          <MoreVertical size={16} />
        </button>
      ),
    },
  ];

  return (
    <div className={styles.tableContainer}>
      <div className={styles.header}>
        <h2 className={styles.title}>Tenant Management</h2>
        <button className={styles.viewAllButton} disabled title="Tenant detail view coming soon">View all tenants</button>
      </div>

      <DataTable
        columns={columns}
        rows={tenants}
        rowKey={(tenant) => tenant.id}
        isLoading={isLoading}
        caption="Tenant organizations"
        className={styles.table}
        empty={{
          icon: <Building2 size={20} />,
          title: 'No tenants yet',
          description: 'Organizations that sign up will be listed here.',
        }}
      />

      <div className={styles.footer}>
        <span className={styles.footerText}>Showing {tenants.length} tenants</span>
      </div>
    </div>
  );
};
