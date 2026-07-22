import React, { useState } from 'react';
import { Plus, Warehouse, Package, Truck } from 'lucide-react';
import { KPICard } from '../../../components/ui/KPICard';
import { WarehouseTable } from '../../../components/inventory/WarehouseTable/WarehouseTable';
import type { WarehouseRowData } from '../../../components/inventory/WarehouseTable/WarehouseTable';
import { WarehouseFormModal } from '../../../components/inventory/WarehouseFormModal/WarehouseFormModal';
import type { WarehouseFormData } from '../../../components/inventory/WarehouseFormModal/WarehouseFormModal';
import { DeleteWarehouseModal } from '../../../components/inventory/DeleteWarehouseModal/DeleteWarehouseModal';
import styles from './WarehouseList.module.css';

import { useWarehouses, useCreateWarehouse, useUpdateWarehouse, useDeleteWarehouse } from '../../../hooks/useWarehouses';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { AppLayout } from '../../../components/layout/AppLayout/AppLayout';
import { Sidebar } from '../../../components/layout/Sidebar/Sidebar';
import { useAuthStore } from '../../../store/useAuthStore';
import { useLogout } from '../../../hooks/useLogout';
import { useNavigation } from '../../../hooks/useNavigation';

const WarehouseListContent: React.FC = () => {
  const { warehouses, fetchWarehouses } = useWarehouses();
  const { createWarehouse } = useCreateWarehouse();
  const { updateWarehouse } = useUpdateWarehouse();
  const { deleteWarehouse } = useDeleteWarehouse();

  React.useEffect(() => {
    fetchWarehouses();
  }, [fetchWarehouses]);

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
      await updateWarehouse(editingWarehouse.id, data);
    } else {
      await createWarehouse(data);
    }
    await fetchWarehouses();
    setIsFormModalOpen(false);
  };

  const handleOpenDelete = (wh: WarehouseRowData) => {
    setDeletingWarehouse(wh);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (deletingWarehouse) {
      await deleteWarehouse(deletingWarehouse.id);
      await fetchWarehouses();
      setIsDeleteModalOpen(false);
    }
  };

  // Map backend Warehouse[] (address: string | null | undefined) to WarehouseRowData[] (address: string | null)
  const warehouseRows: WarehouseRowData[] = warehouses.map(w => ({
    id: w.id,
    name: w.name,
    address: w.address ?? null,
  }));

  const { user } = useAuthStore();
  const isBusinessOwner = user?.role === 'BUSINESS_OWNER';

  return (
    <div className={styles.pageContainer}>
      <header className={styles.header}>
        <div>
          <h2 className={styles.pageTitle}>Warehouse Infrastructure</h2>
          <p className={styles.pageSubtitle}>Configure and manage your regional logistics hubs.</p>
        </div>
        {isBusinessOwner && (
          <button className={styles.addButton} onClick={handleOpenAdd}>
            <Plus size={20} />
            Add Warehouse
          </button>
        )}
      </header>

      {/* MOCK DATA - Backend currently only supports Warehouse entities, not capacity/traffic KPIs */}
      <div className={styles.kpiGrid}>
        <KPICard
          title="Total Active"
          value="12"
          icon={<Warehouse />}
          trendValue="0%"
          trendDirection="up"
        />
        <KPICard
          title="Capacity Used"
          value="84%"
          icon={<Package />}
          trendValue="2%"
          trendDirection="up"
        />
        <KPICard
          title="Hub Traffic"
          value="Optimal"
          icon={<Truck />}
        />
      </div>

      <WarehouseTable 
        warehouses={warehouseRows}
        onEdit={handleOpenEdit}
        onDelete={handleOpenDelete}
        readOnly={!isBusinessOwner}
      />

      <WarehouseFormModal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        onSave={handleSaveForm}
        initialData={editingWarehouse ? { name: editingWarehouse.name, address: editingWarehouse.address ?? '' } : null}
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

export const WarehouseList: React.FC = () => {
  const navigate = useNavigate();
  const { tenantSlug } = useParams();
  const { user } = useAuthStore();
  const { logout } = useLogout();
  const location = useLocation();
  const navItems = useNavigation(user?.role, location.pathname);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const userName = user?.userId ? `User ${user.userId.substring(0, 8)}` : 'Business Owner';
  const roleName = user?.role === 'STAFF' ? 'Sales Representative' : 'Enterprise Tier';

  return (
    <AppLayout
      userName={userName}
      onLogout={handleLogout}
      onSettingsClick={() => navigate(`/${tenantSlug}/settings`)}
      userAvatarSrc="https://lh3.googleusercontent.com/aida-public/AB6AXuCUVO_U904UXtp4jWW0TlbxmzPuBGIREJnS7rJvUtLWgv77vYvS4vxvhNtsn7uCPM4v19ncCYsTNjqR9gmBTthGZKxWksFTi3WHzwUACJE3fdYz43ve1_UcjRrGN0DsSAnzWy8bcm_ue3gBSicCHOQXi3nTG59avgqC7yDJvl_xzAPCtNRbIGrfduLtU3kRkzKkv4b6G4JpGzlfYerk5A74tOh2EEID2ccvMJyWClcbv_w3W2yL1Gy2hiSvmpCVC63iIga-3SmPV8Nj"
      sidebar={
        <Sidebar 
          orgName={tenantSlug || 'Workspace'} 
          orgTier={roleName} 
          navItems={navItems} 
          onLogoutClick={handleLogout}
          onNavItemClick={(id) => navigate(`/${tenantSlug || ''}/${id === 'dashboard' ? '' : id}`)}
        />
      }
    >
      <WarehouseListContent />
    </AppLayout>
  );
};
