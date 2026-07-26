import React, { useState } from 'react';
import { Package, ArrowDown, Info as InfoIcon, ArrowRightLeft } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { SlideOver } from '../../ui/SlideOver';
import { SelectInput } from '../../ui/SelectInput';
import { TextInput } from '../../ui/TextInput';
import { TextareaInput } from '../../ui/TextareaInput';
import { Button } from '../../ui/Button';
import { useProductStock, useAdjustStock, useTransferStock } from '../../../hooks/useInventory';
import { useWarehouses } from '../../../hooks/useWarehouses';
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
  const { t } = useTranslation('inventory');
  const { t: tc } = useTranslation('common');
  const [activeTab, setActiveTab] = useState<TabType>('adjust');
  const [adjustType, setAdjustType] = useState<AdjustType>('subtract');
  const [reason, setReason] = useState<ReasonType | null>(null);

  const { stockLevels, fetchStock } = useProductStock(productId);
  const { warehouses, fetchWarehouses } = useWarehouses();
  
  const { adjustStock, isPending: isAdjustPending } = useAdjustStock();
  const { transferStock, isPending: isTransferPending } = useTransferStock();

  React.useEffect(() => {
    fetchStock();
    fetchWarehouses();
  }, [fetchStock, fetchWarehouses]);

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
      
      await adjustStock(productId, {
        warehouseId: adjustWarehouseId,
        quantityChange: finalQuantity,
        reason: [reason, notes].filter(Boolean).join(' - ')
      });
    } else {
      if (!transferOriginId || !transferDestinationId || !transferQuantity) return;
      const numQty = parseInt(transferQuantity);
      if (isNaN(numQty) || numQty <= 0) return;
      
      await transferStock(productId, {
        fromWarehouseId: transferOriginId,
        toWarehouseId: transferDestinationId,
        quantity: numQty,
        reason: notes
      });
    }
    
    await fetchStock();
    
    // Reset forms
    setAdjustQuantity('');
    setTransferQuantity('');
    setNotes('');
    setReason(null);
    onClose();
  };

  return (
    <SlideOver isOpen={isOpen} onClose={onClose} title={t('stock.adjustTitle', { product: productName })}>
      <div className={styles.container}>
        
        {/* Current Stock Summary - MOCK */}
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <Package size={20} />
            <span>{t('stock.currentLevels')}</span>
          </div>
          <div className={styles.stockGrid}>
            {stockLevels.map(sl => (
              <div key={sl.warehouseId} className={styles.stockCard}>
                <span className={styles.stockCardLabel}>{sl.warehouse?.name || 'Unknown'}</span>
                <span className={styles.stockCardValue}>{sl.quantity} units</span>
              </div>
            ))}
            {stockLevels.length === 0 && (
              <p className={styles.emptyText}>{t('stock.noLevels')}</p>
            )}
          </div>
        </section>

        {/* Tabs */}
        <div className={styles.tabBar}>
          <button
            className={`${styles.tabButton} ${activeTab === 'adjust' ? styles.tabActive : ''}`}
            onClick={() => setActiveTab('adjust')}
          >
            <Package size={16} />
            {t('stock.tabAdjust')}
          </button>
          <button
            className={`${styles.tabButton} ${activeTab === 'transfer' ? styles.tabActive : ''}`}
            onClick={() => setActiveTab('transfer')}
          >
            <ArrowRightLeft size={16} />
            {t('stock.tabTransfer')}
          </button>
        </div>

        {/* Adjustment Form */}
        {activeTab === 'adjust' && (
          <div className={styles.formSection}>
            <SelectInput 
              label={t('stock.selectLocation')}
              value={adjustWarehouseId}
              onChange={(e) => setAdjustWarehouseId(e.target.value)}
            >
              <option value="">{t('stock.selectWarehouse')}</option>
              {stockLevels.map(l => (
                <option key={l.warehouseId} value={l.warehouseId}>
                  {l.warehouse?.name || 'Unknown'} ({l.quantity} units)
                </option>
              ))}
            </SelectInput>

            <div className={styles.splitRow}>
              <div className={styles.typeSelectorWrapper}>
                <label className={styles.fieldLabel}>{t('stock.type')}</label>
                <div className={styles.typeToggle}>
                  <button
                    className={`${styles.typeBtn} ${adjustType === 'subtract' ? styles.typeBtnActive : ''}`}
                    onClick={() => setAdjustType('subtract')}
                  >
                    Subtract
                  </button>
                  <button
                    className={`${styles.typeBtn} ${adjustType === 'add' ? styles.typeBtnActive : ''}`}
                    onClick={() => setAdjustType('add')}
                  >
                    Add
                  </button>
                </div>
              </div>
              <TextInput
                label={t('stock.quantity')}
                type="number"
                value={adjustQuantity}
                onChange={(e) => setAdjustQuantity(e.target.value)}
                placeholder={t('stock.quantityPlaceholder')}
              />
            </div>

            <div className={styles.reasonGrid}>
              <label className={styles.fieldLabel}>{t('stock.reason')}</label>
              <div className={styles.reasonOptions}>
                {(['damaged', 'audit', 'return', 'other'] as ReasonType[]).map(r => (
                  <button
                    key={r}
                    className={`${styles.reasonChip} ${reason === r ? styles.reasonChipActive : ''}`}
                    onClick={() => setReason(r)}
                  >
                    {r.charAt(0).toUpperCase() + r.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            <TextareaInput
              label={t('stock.notesLabel')}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={t('stock.notesPlaceholder')}
            />
          </div>
        )}

        {/* Transfer Form */}
        {activeTab === 'transfer' && (
          <div className={styles.formSection}>
            <SelectInput 
              label={t('stock.originLabel')}
              value={transferOriginId}
              onChange={(e) => setTransferOriginId(e.target.value)}
            >
              <option value="">{t('stock.selectOrigin')}</option>
              {stockLevels.map(l => (
                <option key={l.warehouseId} value={l.warehouseId}>
                  {l.warehouse?.name || 'Unknown'} ({l.quantity} units)
                </option>
              ))}
            </SelectInput>

            <div className={styles.arrowDivider}>
              <div className={styles.arrowIconWrap}>
                <ArrowDown size={20} />
              </div>
            </div>

            <SelectInput 
              label={t('stock.destinationLabel')}
              value={transferDestinationId}
              onChange={(e) => setTransferDestinationId(e.target.value)}
            >
              <option value="">{t('stock.selectDestination')}</option>
              {warehouses.map(l => (
                <option key={l.id} value={l.id}>
                  {l.name}
                </option>
              ))}
            </SelectInput>

            <div className={styles.transferQuantityWrap}>
              <TextInput 
                label={t('stock.transferQuantity')}
                type="number"
                value={transferQuantity}
                onChange={(e) => setTransferQuantity(e.target.value)}
              />
              <span className={styles.maxLabel}>MAX: {stockLevels.find(s => s.warehouseId === transferOriginId)?.quantity || 0}</span>
            </div>

            <div className={styles.infoBanner}>
              <InfoIcon size={20} className={styles.infoIcon} />
              <p>{t('stock.transferNote')}</p>
            </div>
          </div>
        )}

      </div>

      <div className={styles.footer}>
        <Button variant="outline" fullWidth onClick={onClose} disabled={isAdjustPending || isTransferPending}>{tc('actions.cancel')}</Button>
        <Button variant="primary" fullWidth onClick={handleConfirm} disabled={isAdjustPending || isTransferPending}>
          {isAdjustPending || isTransferPending ? 'Updating...' : 'Confirm Update'}
        </Button>
      </div>
    </SlideOver>
  );
};
