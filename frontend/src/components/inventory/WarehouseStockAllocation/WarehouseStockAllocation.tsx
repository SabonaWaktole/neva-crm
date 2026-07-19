import { Store, MapPin } from 'lucide-react';
import { Button } from '../../ui/Button/Button';
import { WarehouseStockRow } from './WarehouseStockRow';
import styles from './WarehouseStockAllocation.module.css';

export interface WarehouseStockRowData {
  id: string;
  warehouseId: string;
  quantity: number;
}

export interface WarehouseStockAllocationProps {
  rows: WarehouseStockRowData[];
  onAddRow: () => void;
  onChangeRow: (id: string, field: 'warehouseId' | 'quantity', value: string | number) => void;
  onRemoveRow: (id: string) => void;
  availableWarehouses: Array<{ id: string; name: string }>;
}

export function WarehouseStockAllocation({
  rows,
  onAddRow,
  onChangeRow,
  onRemoveRow,
  availableWarehouses,
}: WarehouseStockAllocationProps) {
  const totalQuantity = rows.reduce((sum, row) => sum + (Number(row.quantity) || 0), 0);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <MapPin size={20} className={styles.icon} />
          <h2 className={styles.title}>Starting Stock by Location</h2>
        </div>
        <Button 
          type="button" 
          variant="outline" 
          onClick={onAddRow} 
          icon={<Store size={16} />} 
          iconPosition="left"
          disabled={rows.filter((r) => r.warehouseId).length >= availableWarehouses.length}
        >
          Add Warehouse Row
        </Button>
      </div>

      <div className={styles.body}>
        {rows.map((row) => {
          // Exclude warehouses already selected by OTHER rows to prevent
          // duplicate (product, warehouse) pairs — backend enforces a unique
          // compound index on (productId, warehouseId) in StockLevel.
          const selectedByOtherRows = new Set(
            rows
              .filter((r) => r.id !== row.id && r.warehouseId)
              .map((r) => r.warehouseId)
          );
          const filteredWarehouses = availableWarehouses.filter(
            (wh) => !selectedByOtherRows.has(wh.id) || wh.id === row.warehouseId
          );

          return (
            <WarehouseStockRow
              key={row.id}
              id={row.id}
              warehouseId={row.warehouseId}
              quantity={row.quantity}
              onWarehouseChange={(id, warehouseId) => onChangeRow(id, 'warehouseId', warehouseId)}
              onQuantityChange={(id, quantity) => onChangeRow(id, 'quantity', quantity)}
              onRemove={onRemoveRow}
              availableWarehouses={filteredWarehouses}
            />
          );
        })}
      </div>

      <div className={styles.footer}>
        <span className={styles.summaryText}>Total Aggregated Inventory Across Selected Nodes:</span>
        <span className={styles.totalValue}>{totalQuantity}</span>
      </div>
    </div>
  );
}
