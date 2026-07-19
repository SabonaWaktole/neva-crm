import React from 'react';
import { Plus, Settings, Tags, Warehouse as WarehouseIcon, FileText, Activity, AlertTriangle, Edit2, Trash2, ChevronRight, MoreVertical } from 'lucide-react';
import styles from './CategoryList.module.css';

interface CategoryRowData {
  id: string;
  name: string;
  itemCount: number; // MOCK DATA
  // Tax Logic omitted per Step 3 constraints
  iconType: 'hardware' | 'description' | 'manufacturing' | 'security';
}

import { useCategories } from '../../../hooks/useInventory';

export const CategoryList: React.FC = () => {
  const { categories: realCategories, fetchCategories } = useCategories();

  React.useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  // MOCK DATA - item counts and icons are decorative
  const categories: CategoryRowData[] = realCategories.map((c, i) => ({
    id: c.id,
    name: c.name,
    itemCount: Math.floor(Math.random() * 500) + 10, // Mock item count
    iconType: ['hardware', 'description', 'manufacturing', 'security'][i % 4] as CategoryRowData['iconType']
  }));

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
          <button className={styles.primaryButton}>
            <Plus size={20} />
            New Category
          </button>
        </div>
      </div>

      <div className={styles.grid}>
        {/* Sidebar Options */}
        <div className={styles.sidebar}>
          <div className={styles.sidebarBox}>
            <h3 className={styles.sidebarTitle}>INVENTORY CONFIG</h3>
            <nav className={styles.navLinks}>
              <a href="#" className={styles.navLink}>
                <span>General Defaults</span>
                <ChevronRight size={18} />
              </a>
              <a href="#" className={`${styles.navLink} ${styles.navLinkActive}`}>
                <span>Category Labels</span>
                <Tags size={18} />
              </a>
              <a href="#" className={styles.navLink}>
                <span>Warehouse Zones</span>
                <WarehouseIcon size={18} />
              </a>
              <a href="#" className={styles.navLink}>
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
              <div className={styles.colActions}>ACTIONS</div>
            </div>

            <div className={styles.listBody}>
              {categories.map(cat => (
                <div key={cat.id} className={styles.row}>
                  <div className={styles.colName}>
                    <div className={styles.catIconWrap}>
                      {getIcon(cat.iconType)}
                    </div>
                    <div>
                      <div className={styles.catName}>{cat.name}</div>
                      <div className={styles.catId}>Key ID: {cat.id} • Root Category</div>
                    </div>
                  </div>
                  <div className={styles.colItems}>
                    <div className={styles.itemCountWrap}>
                      <div className={`${styles.dot} ${styles[`dot-${cat.iconType}`]}`} />
                      <span>{cat.itemCount.toLocaleString()} Items</span>
                    </div>
                  </div>
                  <div className={styles.colActions}>
                    <button className={styles.actionBtn} title="Edit"><Edit2 size={18} /></button>
                    <button className={`${styles.actionBtn} ${styles.actionBtnDanger}`} title="Delete"><Trash2 size={18} /></button>
                    <button className={styles.actionBtn}><MoreVertical size={18} /></button>
                  </div>
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
              <button className={styles.auditBtn}>
                Run System Cleanup
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Simple icon mocks
function Hardware(props: any) { return <Settings {...props} />; }
function Description(props: any) { return <FileText {...props} />; }
function PrecisionManufacturing(props: any) { return <Activity {...props} />; }
function Security(props: any) { return <AlertTriangle {...props} />; }
