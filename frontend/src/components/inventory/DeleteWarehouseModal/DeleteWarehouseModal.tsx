import React from 'react';
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
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Decommission Facility?"
      maxWidth="sm"
    >
      <div className={styles.content}>
        <div className={styles.iconWrapper}>
          <AlertTriangle size={32} className={styles.icon} />
        </div>
        
        <p className={styles.message}>
          Are you sure you want to delete <span className={styles.highlight}>{warehouseName}</span>? 
          This action will archive all local inventory logs and is irreversible.
        </p>

        <div className={styles.actions}>
          <button 
            className={styles.dangerButton} 
            onClick={() => {
              onConfirm();
              onClose();
            }}
          >
            Yes, Delete Facility
          </button>
          <button 
            className={styles.cancelButton} 
            onClick={onClose}
          >
            Keep Facility
          </button>
        </div>
      </div>
    </Modal>
  );
};
