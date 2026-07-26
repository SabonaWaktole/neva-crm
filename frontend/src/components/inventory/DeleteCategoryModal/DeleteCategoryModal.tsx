import React from 'react';
import { useTranslation } from 'react-i18next';
import { Modal } from '../../ui/Modal';
import { Button } from '../../ui/Button';
import { AlertTriangle } from 'lucide-react';

export interface DeleteCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  categoryName: string;
}

export const DeleteCategoryModal: React.FC<DeleteCategoryModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  categoryName,
}) => {
  const { t } = useTranslation('inventory');
  const { t: tc } = useTranslation('common');

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t('categories.deleteTitle')}
      maxWidth="sm"
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-lg)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)', color: 'var(--color-error)' }}>
          <AlertTriangle size={32} />
          <p style={{ margin: 0, fontSize: 'var(--font-size-body-md)', color: 'var(--color-on-surface-variant)' }}>
            {t('categories.deleteConfirmPrefix')}
            <strong>{categoryName}</strong>
            {t('categories.deleteConfirmSuffix')}
          </p>
        </div>

        <p style={{ margin: 0, fontSize: 'var(--font-size-label-md)', color: 'var(--color-on-surface-variant)' }}>
          {t('categories.deleteNote')}
        </p>

        <div style={{ display: 'flex', gap: 'var(--spacing-md)', marginTop: 'var(--spacing-sm)' }}>
          <div style={{ flex: 1 }}>
            <Button variant="outline" onClick={onClose} fullWidth>
              {tc('actions.cancel')}
            </Button>
          </div>
          <div style={{ flex: 1 }}>
            <Button variant="primary" style={{ backgroundColor: 'var(--color-error)' }} onClick={onConfirm} fullWidth>
              {tc('actions.delete')}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};
