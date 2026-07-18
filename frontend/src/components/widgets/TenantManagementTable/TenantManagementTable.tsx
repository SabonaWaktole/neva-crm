import React from 'react';
import styles from './TenantManagementTable.module.css';
import { MoreVertical } from 'lucide-react';
import { Badge } from '../../ui/Badge/Badge';

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
  return (
    <div className={styles.tableContainer}>
      <div className={styles.header}>
        <h2 className={styles.title}>Tenant Management</h2>
        <button className={styles.viewAllButton}>View all tenants</button>
      </div>
      
      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Organization</th>
              <th>Plan</th>
              <th>Status</th>
              <th>Date Joined</th>
              <th className={styles.actionsColumn}></th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={5} className={styles.emptyState}>Loading tenants...</td></tr>
            ) : tenants.length === 0 ? (
              <tr><td colSpan={5} className={styles.emptyState}>No tenants found.</td></tr>
            ) : (
              tenants.map((tenant) => (
                <tr key={tenant.id}>
                  <td>
                    <div className={styles.orgCell}>
                      <div className={styles.avatar}>
                        {tenant.name.substring(0, 2).toUpperCase()}
                      </div>
                      <div className={styles.orgDetails}>
                        <span className={styles.orgName}>{tenant.name}</span>
                        <span className={styles.orgSlug}>{tenant.urlSlug}</span>
                      </div>
                    </div>
                  </td>
                  <td>
                    {/* Honest placeholder for Plan since the backend doesn't track this yet */}
                    <span className={styles.placeholderText}>—</span>
                  </td>
                  <td>
                    {/* Honest placeholder for Status since the backend doesn't track this yet */}
                    <span className={styles.placeholderText}>—</span>
                  </td>
                  <td className={styles.dateCell}>
                    {new Date(tenant.createdAt).toLocaleDateString(undefined, {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric'
                    })}
                  </td>
                  <td className={styles.actionsCell}>
                    <button className={styles.actionButton}>
                      <MoreVertical size={16} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <div className={styles.footer}>
        <span className={styles.footerText}>Showing {tenants.length} tenants</span>
      </div>
    </div>
  );
};
