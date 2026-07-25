import React from 'react';
import { Plus, Settings, Tags, Warehouse as WarehouseIcon, FileText, Activity, AlertTriangle, Edit2, Trash2, ChevronRight, MoreVertical } from 'lucide-react';
import styles from './CategoryList.module.css';

interface CategoryRowData {
  id: string;
  name: string;
  description?: string;
  isArchived?: boolean;
  itemCount: number;
  iconType: 'hardware' | 'description' | 'manufacturing' | 'security';
}

import { useCategories, useCreateCategory, useUpdateCategory, useDeleteCategory, useArchiveCategories } from '../../../hooks/useCategories';
import { CategoryFormModal, type CategoryFormData } from '../../../components/inventory/CategoryFormModal/CategoryFormModal';
import { DeleteCategoryModal } from '../../../components/inventory/DeleteCategoryModal/DeleteCategoryModal';
import { useNavigate, useParams } from 'react-router-dom';
import { SettingsLayout } from '../../../components/layout/SettingsLayout/SettingsLayout';
import { useAuthStore } from '../../../store/useAuthStore';

const CategoryListContent: React.FC = () => {
  const [showArchived, setShowArchived] = React.useState(false);
  const { categories: realCategories, fetchCategories } = useCategories(showArchived);
  const { createCategory } = useCreateCategory();
  const { updateCategory } = useUpdateCategory();
  const { deleteCategory } = useDeleteCategory();
  const { cleanupCategories, isPending: isCleaningUp } = useArchiveCategories();
  
  const { user } = useAuthStore();
  const isBusinessOwner = user?.role === 'BUSINESS_OWNER';

  React.useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const [isFormModalOpen, setIsFormModalOpen] = React.useState(false);
  const [editingCategory, setEditingCategory] = React.useState<CategoryRowData | null>(null);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = React.useState(false);
  const [deletingCategory, setDeletingCategory] = React.useState<CategoryRowData | null>(null);

  const handleOpenAdd = () => {
    setEditingCategory(null);
    setIsFormModalOpen(true);
  };

  const handleOpenEdit = (cat: CategoryRowData) => {
    setEditingCategory(cat);
    setIsFormModalOpen(true);
  };

  const handleSaveForm = async (data: CategoryFormData) => {
    if (editingCategory) {
      await updateCategory(editingCategory.id, data);
    } else {
      await createCategory(data);
    }
    await fetchCategories();
    setIsFormModalOpen(false);
  };

  const handleOpenDelete = (cat: CategoryRowData) => {
    setDeletingCategory(cat);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (deletingCategory) {
      await deleteCategory(deletingCategory.id);
      await fetchCategories();
      setIsDeleteModalOpen(false);
    }
  };

  const navigate = useNavigate();
  const { tenantSlug } = useParams();

  const handleRunCleanup = async () => {
    try {
      const result = await cleanupCategories();
      alert(`System Cleanup: ${result.count} unused categories have been archived successfully.`);
      await fetchCategories();
    } catch (err) {
      alert('Failed to cleanup categories.');
    }
  };

  // MOCK DATA - item counts and icons are decorative. useMemo prevents them from changing on re-renders.
  // Real Item Counts with deterministic decorative icons
  const categories = React.useMemo(() => {
    return realCategories.map((c, i) => ({
      id: c.category.id,
      name: c.category.name,
      description: c.category.description || undefined,
      isArchived: c.category.isArchived,
      itemCount: c.itemCount,
      iconType: ['hardware', 'description', 'manufacturing', 'security'][i % 4] as CategoryRowData['iconType']
    }));
  }, [realCategories]);

  const getIcon = (type: CategoryRowData['iconType']) => {
    switch (type) {
      case 'hardware': return <Hardware className={styles.iconPrimary} />;
      case 'description': return <Description className={styles.iconTertiary} />;
      case 'manufacturing': return <PrecisionManufacturing className={styles.iconSecondary} />;
      case 'security': return <Security className={styles.iconPrimaryFixed} />;
    }
  };

  return (
    <div className={styles.pageContainer}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.breadcrumbs}>
          <span>Settings</span>
          <ChevronRight size={16} />
          <span>Inventory</span>
          <ChevronRight size={16} />
          <span className={styles.breadcrumbActive}>Category Management</span>
        </div>
        <div className={styles.headerTop}>
          <div>
            <h1 className={styles.pageTitle}>Category Management</h1>
            <p className={styles.pageSubtitle}>Define and organize product categories for the global inventory ledger.</p>
          </div>
          {isBusinessOwner && (
            <div style={{ display: 'flex', gap: 'var(--spacing-md)', alignItems: 'center' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px', color: 'var(--color-on-surface-variant)' }}>
                <input type="checkbox" checked={showArchived} onChange={(e) => setShowArchived(e.target.checked)} />
                Show Archived
              </label>
              <button className={styles.primaryButton} onClick={handleOpenAdd}>
                <Plus size={20} />
                New Category
              </button>
            </div>
          )}
        </div>
      </div>

      <div className={styles.grid}>
        {/* Sidebar Options */}
        <div className={styles.sidebar}>
          <div className={styles.sidebarBox}>
            <h3 className={styles.sidebarTitle}>INVENTORY CONFIG</h3>
            <nav className={styles.navLinks}>
              <a href={`/${tenantSlug}/settings/company`} onClick={(e) => { e.preventDefault(); navigate(`/${tenantSlug}/settings/company`); }} className={styles.navLink}>
                <span>General Defaults</span>
                <ChevronRight size={18} />
              </a>
              <a href={`/${tenantSlug}/settings/categories`} onClick={(e) => { e.preventDefault(); navigate(`/${tenantSlug}/settings/categories`); }} className={`${styles.navLink} ${styles.navLinkActive}`}>
                <span>Category Labels</span>
                <Tags size={18} />
              </a>
              <a href={`/${tenantSlug}/settings/warehouses`} onClick={(e) => { e.preventDefault(); navigate(`/${tenantSlug}/settings/warehouses`); }} className={styles.navLink}>
                <span>Warehouse Zones</span>
                <WarehouseIcon size={18} />
              </a>
              <a href={`/${tenantSlug}/settings/tax`} onClick={(e) => { e.preventDefault(); alert('Tax Configurations coming soon'); }} className={styles.navLink}>
                <span>Tax Configurations</span>
                <FileText size={18} />
              </a>
            </nav>
          </div>

          <div className={`${styles.sidebarBox} ${styles.insightBox}`}>
            <div className={styles.insightHeader}>
              <Activity size={16} className={styles.insightIcon} />
              <span className={styles.insightTitle}>Data Insight</span>
            </div>
            <p className={styles.insightText}>
              Categories help in generating granular reporting. Each category can be mapped to specific tax codes and GL accounts.
            </p>
          </div>
        </div>

        {/* Main List Area */}
        <div className={styles.mainContent}>
          <div className={styles.listContainer}>
            <div className={styles.listHeader}>
              <div className={styles.colName}>CATEGORY NAME</div>
              <div className={styles.colItems}>ITEM COUNT</div>
              {isBusinessOwner && <div className={styles.colActions}>ACTIONS</div>}
            </div>

            <div className={styles.listBody}>
              {categories.map(cat => (
                <div key={cat.id} className={styles.row}>
                  <div className={styles.colName}>
                    <div className={styles.catIconWrap}>
                      {getIcon(cat.iconType)}
                    </div>
                    <div>
                      <div className={styles.catName}>
                        {cat.name} {cat.isArchived && <span style={{ fontSize: '12px', padding: '2px 6px', background: '#e0e0e0', borderRadius: '4px', marginLeft: '8px' }}>Archived</span>}
                      </div>
                      <div className={styles.catId}>Key ID: {cat.id} • Root Category</div>
                    </div>
                  </div>
                  <div className={styles.colItems}>
                    <div className={styles.itemCountWrap}>
                      <div className={`${styles.dot} ${styles[`dot-${cat.iconType}`]}`} />
                      <span>{cat.itemCount.toLocaleString()} Items</span>
                    </div>
                  </div>
                  {isBusinessOwner && (
                    <div className={styles.colActions}>
                      <button className={styles.actionBtn} title="Edit" onClick={() => handleOpenEdit(cat)}>
                        <Edit2 size={18} />
                      </button>
                      <button className={`${styles.actionBtn} ${styles.actionBtnDanger}`} title="Delete" onClick={() => handleOpenDelete(cat)}>
                        <Trash2 size={18} />
                      </button>
                      <button className={styles.actionBtn}><MoreVertical size={18} /></button>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className={styles.listFooter}>
              <button className={styles.loadMoreBtn}>
                <Plus size={18} />
                Load 12 more categories
              </button>
            </div>
          </div>

          {/* Secondary Widgets - ALL MOCK DATA */}
          <div className={styles.widgetsGrid}>
            <div className={styles.widgetCard}>
              <div className={styles.widgetHeader}>
                <h3>Hierarchy Health</h3>
                <Activity size={20} className={styles.iconPrimary} />
              </div>
              <div className={styles.progressSection}>
                <div className={styles.progressRow}>
                  <span>Root Categories</span>
                  <strong>14</strong>
                </div>
                <div className={styles.progressBarBg}>
                  <div className={styles.progressBarFillPrimary} style={{ width: '65%' }} />
                </div>
                <div className={styles.progressRow}>
                  <span>Sub-Categories</span>
                  <strong>82</strong>
                </div>
                <div className={styles.progressBarBg}>
                  <div className={styles.progressBarFillTertiary} style={{ width: '88%' }} />
                </div>
              </div>
            </div>

            <div className={`${styles.widgetCard} ${styles.widgetCardHigh}`}>
              <h3 className={styles.widgetTitle}>QUICK AUDIT</h3>
              <div className={styles.auditAlert}>
                <div className={styles.auditIconWrap}>
                  <AlertTriangle size={20} />
                </div>
                <div>
                  <div className={styles.auditMain}>3 Unused Categories</div>
                  <div className={styles.auditSub}>Consider archiving for database cleanup.</div>
                </div>
              </div>
              <button className={styles.auditBtn} onClick={handleRunCleanup} disabled={isCleaningUp}>
                {isCleaningUp ? 'Cleaning up...' : 'Run System Cleanup'}
              </button>
            </div>
          </div>
        </div>
      </div>

      <CategoryFormModal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        onSave={handleSaveForm}
        initialData={editingCategory ? { name: editingCategory.name, description: editingCategory.description || '' } : null}
      />

      {deletingCategory && (
        <DeleteCategoryModal
          isOpen={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
          onConfirm={handleConfirmDelete}
          categoryName={deletingCategory.name}
        />
      )}
    </div>
  );
};

// Simple icon mocks
function Hardware(props: any) { return <Settings {...props} />; }
function Description(props: any) { return <FileText {...props} />; }
function PrecisionManufacturing(props: any) { return <Activity {...props} />; }
function Security(props: any) { return <AlertTriangle {...props} />; }

export const CategoryList: React.FC = () => {
  return (
    <SettingsLayout activeNavId="settings/categories">
      <CategoryListContent />
    </SettingsLayout>
  );
};
