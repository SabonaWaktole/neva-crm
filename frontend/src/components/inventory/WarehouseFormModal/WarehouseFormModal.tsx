import { useTranslation } from 'react-i18next';
import React, { useState, useEffect } from 'react';
import { Modal } from '../../ui/Modal';
import { TextInput } from '../../ui/TextInput';
import { TextareaInput } from '../../ui/TextareaInput';
import { Button } from '../../ui/Button';
import styles from './WarehouseFormModal.module.css';

export interface WarehouseFormData {
  name: string;
  address: string;
}

export interface WarehouseFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: WarehouseFormData) => void;
  initialData?: WarehouseFormData | null;
}

export const WarehouseFormModal: React.FC<WarehouseFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData,
}) => {
  const { t } = useTranslation('inventory');
  const { t: tc } = useTranslation('common');
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');

  useEffect(() => {
    if (isOpen) {
      setName(initialData?.name || '');
      setAddress(initialData?.address || '');
    }
  }, [isOpen, initialData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ name, address });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? 'Edit Facility' : 'Configure Facility'}
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.formGroup}>
          <TextInput
            label={t('warehouses.formNameLabel')}
            placeholder={t('warehouses.formNamePlaceholder')}
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>
        <div className={styles.formGroup}>
          <TextareaInput
            label={t('warehouses.formAddressLabel')}
            placeholder={t('warehouses.formAddressPlaceholder')}
            rows={3}
            value={address}
            onChange={(e) => setAddress(e.target.value)}
          />
        </div>
        {/* Storage Class and Initial Status omitted intentionally per backend schema (Step 3 presentational mock) */}
        
        <div className={styles.actions}>
          <Button variant="outline" type="button" onClick={onClose} fullWidth>
            {tc('actions.cancel')}
          </Button>
          <Button variant="primary" type="submit" fullWidth>
            {t('warehouses.saveFacility')}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
