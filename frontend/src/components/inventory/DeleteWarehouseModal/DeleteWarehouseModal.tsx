import React from 'react';
import { useTranslation } from 'react-i18next';
import { AlertTriangle } from 'lucide-react';
import { Modal } from '../../ui/Modal';
import styles from './DeleteWarehouseModal.module.css';

export interface DeleteWarehouseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  warehouseName: string;
}

export const DeleteWarehouseModal: React.FC<DeleteWarehouseModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  warehouseName,
}) => {
  const { t } = useTranslation('inventory');

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t('warehouses.deleteTitle')}
      maxWidth="sm"
    >
      <div className={styles.content}>
        <div className={styles.iconWrapper}>
          <AlertTriangle size={32} className={styles.icon} />
        </div>
        
        <p className={styles.message}>
          {t('warehouses.deleteConfirmPrefix')}
          <span className={styles.highlight}>{warehouseName}</span>
          {t('warehouses.deleteConfirmSuffix')}
        </p>

        <div className={styles.actions}>
          <button 
            className={styles.dangerButton} 
            onClick={() => {
              onConfirm();
              onClose();
            }}
          >
            {t('warehouses.deleteConfirmButton')}
          </button>
          <button 
            className={styles.cancelButton} 
            onClick={onClose}
          >
            {t('warehouses.keepFacility')}
          </button>
        </div>
      </div>
    </Modal>
  );
};
