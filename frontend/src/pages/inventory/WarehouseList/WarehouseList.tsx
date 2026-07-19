import React, { useState } from 'react';
import { Plus, Warehouse, Package, Truck } from 'lucide-react';
import { KPICard } from '../../../components/ui/KPICard';
import { WarehouseTable, WarehouseRowData } from '../../../components/inventory/WarehouseTable/WarehouseTable';
import { WarehouseFormModal, WarehouseFormData } from '../../../components/inventory/WarehouseFormModal/WarehouseFormModal';
import { DeleteWarehouseModal } from '../../../components/inventory/DeleteWarehouseModal/DeleteWarehouseModal';
import styles from './WarehouseList.module.css';

import { useWarehouses, useCreateWarehouse, useUpdateWarehouse, useDeleteWarehouse } from '../../../hooks/useInventory';

export const WarehouseList: React.FC = () => {
  const { data: warehouses = [] } = useWarehouses();
  const createMutation = useCreateWarehouse();
  const updateMutation = useUpdateWarehouse();
  const deleteMutation = useDeleteWarehouse();

  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingWarehouse, setEditingWarehouse] = useState<WarehouseRowData | null>(null);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingWarehouse, setDeletingWarehouse] = useState<WarehouseRowData | null>(null);

  const handleOpenAdd = () => {
    setEditingWarehouse(null);
    setIsFormModalOpen(true);
  };

  const handleOpenEdit = (wh: WarehouseRowData) => {
    setEditingWarehouse(wh);
    setIsFormModalOpen(true);
  };

  const handleSaveForm = async (data: WarehouseFormData) => {
    if (editingWarehouse) {
      await updateMutation.mutateAsync({ warehouseId: editingWarehouse.id, data });
    } else {
      await createMutation.mutateAsync(data);
    }
    setIsFormModalOpen(false);
  };

  const handleOpenDelete = (wh: WarehouseRowData) => {
    setDeletingWarehouse(wh);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (deletingWarehouse) {
      await deleteMutation.mutateAsync(deletingWarehouse.id);
      setIsDeleteModalOpen(false);
    }
  };

  return (
    <div className={styles.pageContainer}>
      <header className={styles.header}>
        <div>
          <h2 className={styles.pageTitle}>Warehouse Infrastructure</h2>
          <p className={styles.pageSubtitle}>Configure and manage your regional logistics hubs.</p>
        </div>
        <button className={styles.addButton} onClick={handleOpenAdd}>
          <Plus size={20} />
          Add Warehouse
        </button>
      </header>

      {/* MOCK DATA - Backend currently only supports Warehouse entities, not capacity/traffic KPIs */}
      <div className={styles.kpiGrid}>
        <KPICard
          title="Total Active"
          value="12"
          icon={<Warehouse />}
          trend={{ direction: 'up', value: '0%' }}
        />
        <KPICard
          title="Capacity Used"
          value="84%"
          icon={<Package />}
          trend={{ direction: 'up', value: '2%' }}
        />
        <KPICard
          title="Hub Traffic"
          value="Optimal"
          icon={<Truck />}
        />
      </div>

      <WarehouseTable 
        warehouses={warehouses}
        onEdit={handleOpenEdit}
        onDelete={handleOpenDelete}
      />

      <WarehouseFormModal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        onSave={handleSaveForm}
        initialData={editingWarehouse}
      />

      {deletingWarehouse && (
        <DeleteWarehouseModal
          isOpen={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
          onConfirm={handleConfirmDelete}
          warehouseName={deletingWarehouse.name}
        />
      )}
    </div>
  );
};
