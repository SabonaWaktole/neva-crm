import React from 'react';
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
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Delete Category"
      maxWidth="sm"
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-lg)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)', color: 'var(--color-error)' }}>
          <AlertTriangle size={32} />
          <p style={{ margin: 0, fontSize: 'var(--font-size-body-md)', color: 'var(--color-on-surface-variant)' }}>
            Are you sure you want to delete <strong>{categoryName}</strong>? This action cannot be undone.
          </p>
        </div>

        <p style={{ margin: 0, fontSize: 'var(--font-size-label-md)', color: 'var(--color-on-surface-variant)' }}>
          Note: You cannot delete a category if there are products assigned to it.
        </p>

        <div style={{ display: 'flex', gap: 'var(--spacing-md)', marginTop: 'var(--spacing-sm)' }}>
          <div style={{ flex: 1 }}>
            <Button variant="outline" onClick={onClose} fullWidth>
              Cancel
            </Button>
          </div>
          <div style={{ flex: 1 }}>
            <Button variant="primary" style={{ backgroundColor: 'var(--color-error)' }} onClick={onConfirm} fullWidth>
              Delete
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};
