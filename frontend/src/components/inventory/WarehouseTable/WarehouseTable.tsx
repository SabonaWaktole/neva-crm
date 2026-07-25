import React from 'react';
import { Edit2, Trash2, Warehouse, Factory, Landmark, Filter, Download } from 'lucide-react';
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
}

const getRandomIcon = (index: number) => {
  const icons = [
    <Warehouse className={styles.iconPrimary} size={20} />,
    <Factory className={styles.iconTertiary} size={20} />,
    <Landmark className={styles.iconSecondary} size={20} />
  ];
  return icons[index % icons.length];
};

export const WarehouseTable: React.FC<WarehouseTableProps> = ({
  warehouses,
  onEdit,
  onDelete,
  readOnly = false,
}) => {
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
      <div className="table-scroll">
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.th}>FACILITY NAME</th>
              <th className={styles.th}>ADDRESS</th>
              {!readOnly && <th className={`${styles.th} ${styles.textRight}`}>ACTIONS</th>}
            </tr>
          </thead>
          <tbody className={styles.tbody}>
            {warehouses.map((wh, index) => (
              <tr key={wh.id} className={styles.tr}>
                <td className={styles.td}>
                  <div className={styles.nameCell}>
                    <div className={styles.iconWrapper}>
                      {getRandomIcon(index)}
                    </div>
                    <div>
                      <div className={styles.whName}>{wh.name}</div>
                      <div className={styles.whId}>WH-ID: {wh.id.substring(0, 6).toUpperCase()}</div>
                    </div>
                  </div>
                </td>
                <td className={styles.td}>
                  <div className={styles.addressText}>{wh.address || '—'}</div>
                </td>
                {!readOnly && (
                  <td className={`${styles.td} ${styles.textRight}`}>
                    <div className={styles.rowActions}>
                      <button
                        className={`${styles.actionButton} ${styles.editButton}`}
                        onClick={() => onEdit(wh)}
                        aria-label="Edit"
                      >
                        <Edit2 size={18} />
                      </button>
                      <button
                        className={`${styles.actionButton} ${styles.deleteButton}`}
                        onClick={() => onDelete(wh)}
                        aria-label="Delete"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Visual Pagination Placeholder */}
      <div className={styles.footer}>
        <span>Showing {warehouses.length} facilities</span>
      </div>
    </div>
  );
};
