import React, { useState } from 'react';
import { Inventory, South, Info } from '@mui/icons-material'; // Replacing missing lucide icons with standard ones where needed, actually let's stick to Lucide.
// Wait, the design used material symbols. I'll use Lucide icons.
import { Package, ArrowDown, Info as InfoIcon, X, Check, ArrowRightLeft } from 'lucide-react';
import { SlideOver } from '../../ui/SlideOver';
import { SelectInput } from '../../ui/SelectInput';
import { TextInput } from '../../ui/TextInput';
import { TextareaInput } from '../../ui/TextareaInput';
import { Button } from '../../ui/Button';
import { useProductStock, useWarehouses, useAdjustStock, useTransferStock } from '../../../hooks/useInventory';
import styles from './StockAdjustmentPanel.module.css';

export interface StockAdjustmentPanelProps {
  isOpen: boolean;
  onClose: () => void;
  productId: string;
  productName: string;
}

type TabType = 'adjust' | 'transfer';
type AdjustType = 'add' | 'subtract';
type ReasonType = 'damaged' | 'audit' | 'return' | 'other';

export const StockAdjustmentPanel: React.FC<StockAdjustmentPanelProps> = ({
  isOpen,
  onClose,
  productId,
  productName,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('adjust');
  const [adjustType, setAdjustType] = useState<AdjustType>('subtract');
  const [reason, setReason] = useState<ReasonType | null>(null);

  const { data: stockLevels = [], isLoading } = useProductStock(productId);
  const { data: warehouses = [] } = useWarehouses();
  
  const adjustMutation = useAdjustStock();
  const transferMutation = useTransferStock();

  const [adjustWarehouseId, setAdjustWarehouseId] = useState('');
  const [adjustQuantity, setAdjustQuantity] = useState('');
  const [notes, setNotes] = useState('');

  const [transferOriginId, setTransferOriginId] = useState('');
  const [transferDestinationId, setTransferDestinationId] = useState('');
  const [transferQuantity, setTransferQuantity] = useState('');

  // Auto-select first warehouse when stockLevels load
  React.useEffect(() => {
    if (stockLevels.length > 0 && !adjustWarehouseId) setAdjustWarehouseId(stockLevels[0].warehouseId);
    if (stockLevels.length > 0 && !transferOriginId) setTransferOriginId(stockLevels[0].warehouseId);
  }, [stockLevels]);

  const handleConfirm = async () => {
    if (activeTab === 'adjust') {
      if (!adjustWarehouseId || !adjustQuantity) return;
      const numQty = parseInt(adjustQuantity);
      if (isNaN(numQty) || numQty <= 0) return;
      const finalQuantity = adjustType === 'subtract' ? -numQty : numQty;
      
      await adjustMutation.mutateAsync({
        productId,
        data: {
          warehouseId: adjustWarehouseId,
          quantity: finalQuantity,
          reason: [reason, notes].filter(Boolean).join(' - ')
        }
      });
    } else {
      if (!transferOriginId || !transferDestinationId || !transferQuantity) return;
      const numQty = parseInt(transferQuantity);
      if (isNaN(numQty) || numQty <= 0) return;
      
      await transferMutation.mutateAsync({
        productId,
        data: {
          fromWarehouseId: transferOriginId,
          toWarehouseId: transferDestinationId,
          quantity: numQty,
          reason: notes
        }
      });
    }
    
    // Reset forms
    setAdjustQuantity('');
    setTransferQuantity('');
    setNotes('');
    setReason(null);
    onClose();
  };

  return (
    <SlideOver isOpen={isOpen} onClose={onClose} title="New Adjustment" subtitle={`Update stock levels for ${productName}`}>
      <div className={styles.container}>
        
        {/* Current Stock Summary - MOCK */}
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <Package size={16} />
            <h4 className={styles.sectionTitle}>CURRENT DISTRIBUTION</h4>
          </div>
          <div className={styles.distributionGrid}>
            {isLoading ? <div>Loading stock...</div> : stockLevels.map((loc) => (
              <div key={loc.id} className={styles.distCard}>
                <p className={styles.distName}>{loc.warehouse?.name || 'Unknown'}</p>
                <p className={styles.distQuantity}>
                  {loc.quantity} <span className={styles.distUnits}>units</span>
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Tabs Switcher */}
        <div className={styles.tabsWrapper}>
          <button 
            className={`${styles.tabButton} ${activeTab === 'adjust' ? styles.tabActive : ''}`}
            onClick={() => setActiveTab('adjust')}
          >
            Adjust Quantity
          </button>
          <button 
            className={`${styles.tabButton} ${activeTab === 'transfer' ? styles.tabActive : ''}`}
            onClick={() => setActiveTab('transfer')}
          >
            Transfer Stock
          </button>
        </div>

        {/* Adjustment Form */}
        {activeTab === 'adjust' && (
          <div className={styles.formSection}>
            <SelectInput 
              label="Select Location"
              options={stockLevels.map(l => ({ value: l.warehouseId, label: `${l.warehouse?.name || 'Unknown'} (${l.quantity} units)` }))}
              value={adjustWarehouseId}
              onChange={(e) => setAdjustWarehouseId(e.target.value)}
            />

            <div className={styles.splitRow}>
              <div className={styles.typeSelectorWrapper}>
                <label className={styles.fieldLabel}>Type</label>
                <div className={styles.typeToggle}>
                  <button 
                    className={`${styles.typeBtn} ${adjustType === 'subtract' ? styles.typeSubtractActive : ''}`}
                    onClick={() => setAdjustType('subtract')}
                  >
                    -
                  </button>
                  <button 
                    className={`${styles.typeBtn} ${adjustType === 'add' ? styles.typeAddActive : ''}`}
                    onClick={() => setAdjustType('add')}
                  >
                    +
                  </button>
                </div>
              </div>
              <div className={styles.quantityWrapper}>
                <TextInput 
                  label="Quantity"
                  type="number"
                  placeholder="0"
                  value={adjustQuantity}
                  onChange={(e) => setAdjustQuantity(e.target.value)}
                />
              </div>
            </div>

            <div className={styles.reasonSection}>
              <label className={styles.fieldLabel}>Adjustment Reason</label>
              <div className={styles.reasonGrid}>
                {[
                  { id: 'damaged', label: 'Damaged', icon: <X size={14} /> },
                  { id: 'audit', label: 'Audit', icon: <Package size={14} /> },
                  { id: 'return', label: 'Return', icon: <ArrowRightLeft size={14} /> },
                  { id: 'other', label: 'Other', icon: <InfoIcon size={14} /> },
                ].map((r) => (
                  <button 
                    key={r.id}
                    className={`${styles.reasonBtn} ${reason === r.id ? styles.reasonBtnActive : ''}`}
                    onClick={() => setReason(r.id as ReasonType)}
                  >
                    {r.icon} {r.label}
                  </button>
                ))}
              </div>
              <TextareaInput 
                label=""
                placeholder="Additional notes..."
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </div>
        )}

        {/* Transfer Form */}
        {activeTab === 'transfer' && (
          <div className={styles.formSection}>
            <SelectInput 
              label="Origin Location"
              options={stockLevels.map(l => ({ value: l.warehouseId, label: `${l.warehouse?.name || 'Unknown'} (${l.quantity} units)` }))}
              value={transferOriginId}
              onChange={(e) => setTransferOriginId(e.target.value)}
            />

            <div className={styles.arrowDivider}>
              <div className={styles.arrowIconWrap}>
                <ArrowDown size={20} />
              </div>
            </div>

            <SelectInput 
              label="Destination Location"
              options={warehouses.map(l => ({ value: l.id, label: `${l.name}` }))}
              value={transferDestinationId}
              onChange={(e) => setTransferDestinationId(e.target.value)}
            />

            <div className={styles.transferQuantityWrap}>
              <TextInput 
                label="Transfer Quantity"
                type="number"
                value={transferQuantity}
                onChange={(e) => setTransferQuantity(e.target.value)}
              />
              <span className={styles.maxLabel}>MAX: {stockLevels.find(s => s.warehouseId === transferOriginId)?.quantity || 0}</span>
            </div>

            <div className={styles.infoBanner}>
              <InfoIcon size={20} className={styles.infoIcon} />
              <p>Transfers between international hubs may take up to 48 hours for local database synchronization.</p>
            </div>
          </div>
        )}

      </div>

      <div className={styles.footer}>
        <Button variant="outline" fullWidth onClick={onClose} disabled={adjustMutation.isPending || transferMutation.isPending}>Cancel</Button>
        <Button variant="primary" fullWidth onClick={handleConfirm} disabled={adjustMutation.isPending || transferMutation.isPending}>
          {adjustMutation.isPending || transferMutation.isPending ? 'Updating...' : 'Confirm Update'}
        </Button>
      </div>
    </SlideOver>
  );
};
