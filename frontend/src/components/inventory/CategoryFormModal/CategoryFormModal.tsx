import { useTranslation } from 'react-i18next';
import React, { useState, useEffect } from 'react';
import { Modal } from '../../ui/Modal';
import { TextInput } from '../../ui/TextInput';
import { TextareaInput } from '../../ui/TextareaInput';
import { Button } from '../../ui/Button';
import styles from './CategoryFormModal.module.css';

export interface CategoryFormData {
  name: string;
  description?: string;
}

export interface CategoryFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: CategoryFormData) => void;
  initialData?: CategoryFormData | null;
}

export const CategoryFormModal: React.FC<CategoryFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData,
}) => {
  const { t } = useTranslation('inventory');
  const { t: tc } = useTranslation('common');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    if (isOpen) {
      setName(initialData?.name || '');
      setDescription(initialData?.description || '');
    }
  }, [isOpen, initialData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ name, description });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? 'Edit Category' : 'New Category'}
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.formGroup}>
          <TextInput
            label={t('categories.formNameLabel')}
            placeholder={t('categories.formNamePlaceholder')}
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>
        <div className={styles.formGroup}>
          <TextareaInput
            label={t('categories.formDescriptionLabel')}
            placeholder={t('categories.formDescriptionPlaceholder')}
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
        
        <div className={styles.actions}>
          <Button variant="outline" type="button" onClick={onClose} fullWidth>
            {tc('actions.cancel')}
          </Button>
          <Button variant="primary" type="submit" fullWidth>
            {t('categories.saveCategory')}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
