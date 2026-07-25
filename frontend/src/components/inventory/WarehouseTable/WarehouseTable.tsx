import React from 'react';
import { Edit2, Trash2, Warehouse, Factory, Landmark, Filter, Download } from 'lucide-react';
import { DataTable } from '../../ui/DataTable';
import type { DataTableColumn } from '../../ui/DataTable';
import styles from './WarehouseTable.module.css';

export interface WarehouseRowData {
  id: string;
  name: string;
  address: string | null;
  // Storage Class and Status omitted per Step 3 scoping constraints (Mock/Decorative only)
}

export interface WarehouseTableProps {
  warehouses: WarehouseRowData[];
  onEdit: (warehouse: WarehouseRowData) => void;
  onDelete: (warehouse: WarehouseRowData) => void;
  readOnly?: boolean;
  isLoading?: boolean;
}

/** Rotates through a small icon set so facilities are visually distinguishable. */
const facilityIcons = [Warehouse, Factory, Landmark];

export const WarehouseTable: React.FC<WarehouseTableProps> = ({
  warehouses,
  onEdit,
  onDelete,
  readOnly = false,
  isLoading,
}) => {
  const columns: DataTableColumn<WarehouseRowData>[] = [
    {
      id: 'name',
      header: 'Facility name',
      cardLabel: null,
      render: (wh) => {
        const index = warehouses.findIndex((w) => w.id === wh.id);
        const Icon = facilityIcons[Math.max(index, 0) % facilityIcons.length];
        return (
          <div className={styles.nameCell}>
            <div className={styles.iconWrapper}>
              <Icon className={styles.icon} size={20} />
            </div>
            <div>
              <div className={styles.whName}>{wh.name}</div>
              <div className={styles.whId}>WH-ID: {wh.id.substring(0, 6).toUpperCase()}</div>
            </div>
          </div>
        );
      },
    },
    {
      id: 'address',
      header: 'Address',
      render: (wh) => <span className={styles.addressText}>{wh.address || '—'}</span>,
    },
    ...(readOnly
      ? []
      : [
          {
            id: 'actions',
            header: 'Actions',
            align: 'right' as const,
            width: '112px',
            cardLabel: null,
            render: (wh: WarehouseRowData) => (
              <div className={styles.rowActions}>
                <button
                  className={`${styles.actionButton} ${styles.editButton}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(wh);
                  }}
                  aria-label={`Edit ${wh.name}`}
                >
                  <Edit2 size={18} />
                </button>
                <button
                  className={`${styles.actionButton} ${styles.deleteButton}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(wh);
                  }}
                  aria-label={`Delete ${wh.name}`}
                >
                  <Trash2 size={18} />
                </button>
              </div>
            ),
          },
        ]),
  ];

  return (
    <div className={styles.tableContainer}>
      <div className={styles.header}>
        <h3 className={styles.headerTitle}>Global Facilities List</h3>
        <div className={styles.headerActions}>
          <button className={styles.iconButton} aria-label="Filter" disabled title="Filtering coming soon">
            <Filter size={18} />
          </button>
          <button className={styles.iconButton} aria-label="Download" disabled title="Export coming soon">
            <Download size={18} />
          </button>
        </div>
      </div>

      <DataTable
        columns={columns}
        rows={warehouses}
        rowKey={(wh) => wh.id}
        isLoading={isLoading}
        caption="Warehouse facilities"
        className={styles.table}
        empty={{
          icon: <Warehouse size={20} />,
          title: 'No facilities yet',
          description: 'Warehouses you create will be listed here.',
        }}
      />

      <div className={styles.footer}>
        <span>Showing {warehouses.length} facilities</span>
      </div>
    </div>
  );
};
