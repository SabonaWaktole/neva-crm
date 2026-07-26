import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation('inventory');




  return (
    <div className={styles.row}>
      <div className={styles.col6}>
        <SelectInput
          label={t('stock.warehouseLabel')}
          value={warehouseId}
          onChange={(e) => onWarehouseChange(id, e.target.value)}
        >
          <option value="" disabled>{t('stock.selectAWarehouse')}</option>
          {availableWarehouses.map((wh) => (
            <option key={wh.id} value={wh.id}>
              {wh.name}
            </option>
          ))}
        </SelectInput>
      </div>
      <div className={styles.col4}>
        <TextInput
          label={t('stock.initialQuantity')}
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
          aria-label={t('stock.removeRowAria')}
        >
          <Trash2 size={18} />
        </button>
      </div>
    </div>
  );
}
