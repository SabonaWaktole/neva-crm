import { Trash2 } from 'lucide-react';
import { SelectInput } from '../../ui/SelectInput/SelectInput';
import { TextInput } from '../../ui/TextInput/TextInput';
import styles from './WarehouseStockRow.module.css';

export interface WarehouseStockRowProps {
  id: string;
  warehouseId: string;
  quantity: number;
  onWarehouseChange: (id: string, newWarehouseId: string) => void;
  onQuantityChange: (id: string, newQuantity: number) => void;
  onRemove: (id: string) => void;
  availableWarehouses: Array<{ id: string; name: string }>;
}

export function WarehouseStockRow({
  id,
  warehouseId,
  quantity,
  onWarehouseChange,
  onQuantityChange,
  onRemove,
  availableWarehouses,
}: WarehouseStockRowProps) {
  return (
    <div className={styles.row}>
      <div className={styles.col6}>
        <SelectInput
          label="Warehouse"
          value={warehouseId}
          onChange={(e) => onWarehouseChange(id, e.target.value)}
        >
          <option value="" disabled>Select a warehouse</option>
          {availableWarehouses.map((wh) => (
            <option key={wh.id} value={wh.id}>
              {wh.name}
            </option>
          ))}
        </SelectInput>
      </div>
      <div className={styles.col4}>
        <TextInput
          label="Initial Quantity"
          type="number"
          min={0}
          value={quantity}
          onChange={(e) => onQuantityChange(id, Number(e.target.value))}
        />
      </div>
      <div className={styles.col2}>
        <button 
          type="button" 
          className={styles.deleteButton} 
          onClick={() => onRemove(id)}
          aria-label="Remove row"
        >
          <Trash2 size={18} />
        </button>
      </div>
    </div>
  );
}
