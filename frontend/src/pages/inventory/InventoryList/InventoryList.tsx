import React from 'react';
import styles from './InventoryList.module.css';
import { Button } from '../../../components/ui/Button';
import { KPICard } from '../../../components/ui/KPICard';
import { TextInput } from '../../../components/ui/TextInput';
import { SelectInput } from '../../../components/ui/SelectInput';
import { InventoryTable } from '../../../components/inventory/InventoryTable';
import { StockAdjustmentPanel } from '../../../components/inventory/StockAdjustmentPanel/StockAdjustmentPanel';
import { useProducts, useCategories } from '../../../hooks/useInventory';
import { useWarehouses } from '../../../hooks/useWarehouses';
import { PlusSquare, Search, Download, TrendingUp, AlertCircle, DollarSign, Database } from 'lucide-react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { AppLayout } from '../../../components/layout/AppLayout/AppLayout';
import { Sidebar } from '../../../components/layout/Sidebar/Sidebar';
import { useAuthStore } from '../../../store/useAuthStore';
import { useLogout } from '../../../hooks/useLogout';
import { useNavigation } from '../../../hooks/useNavigation';

const InventoryListContent: React.FC = () => {
  const navigate = useNavigate();
  const { tenantSlug } = useParams();
  
  const [searchQuery, setSearchQuery] = React.useState('');
  const [categoryId, setCategoryId] = React.useState('');
  // statusFilter: Not mapped to backend yet, deferred to future iteration

  const { products, isLoading, fetchProducts } = useProducts({ 
    query: searchQuery, 
    categoryId: categoryId || undefined 
  });
  
  const { categories, fetchCategories } = useCategories();
  const { warehouses, fetchWarehouses } = useWarehouses();

  React.useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  React.useEffect(() => {
    fetchCategories();
    fetchWarehouses();
  }, [fetchCategories, fetchWarehouses]);

  const [isAdjustPanelOpen, setIsAdjustPanelOpen] = React.useState(false);
  const [productToAdjust, setProductToAdjust] = React.useState<any | null>(null);

  const handleAdjustStock = (product: any) => {
    setProductToAdjust(product);
    setIsAdjustPanelOpen(true);
  };

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.titleContainer}>
          <h1 className={styles.title}>Inventory Management</h1>
          <p className={styles.subtitle}>Manage your products, stock levels, and warehouse allocations.</p>
        </div>
        <Button variant="primary" icon={<PlusSquare size={20} />} onClick={() => navigate(`/${tenantSlug}/inventory/new`)}>
          Add Product
        </Button>
      </div>

      {/* KPI Grid */}
      <div className={styles.kpiGrid}>
        {/* MOCK DATA TO BE REPLACED IN STEP 4 (Live data via SearchProductsUseCase / counting query) */}
        <KPICard
          title="Total SKUs"
          value={products.length.toString()}
          icon={<TrendingUp size={20} />}
          trendValue="All active products"
          trendDirection="neutral"
        />
        {/* MOCK DATA TO BE REPLACED IN STEP 4 (Live data via SearchProductsUseCase / filtering query) */}
        <KPICard
          title="Out of Stock"
          value={products.filter(p => p.status === 'OUT_OF_STOCK' || p.status === 'Out of Stock').length.toString()}
          icon={<AlertCircle size={20} />}
          iconColor="var(--color-error)"
          iconBgColor="var(--color-error-container)"
          trendValue="Needs attention"
          trendDirection="down"
        />
        <KPICard
          title="Inventory Value"
          value="TBD"
          icon={<DollarSign size={20} />}
          iconColor="var(--color-secondary)"
          iconBgColor="var(--color-secondary-container)"
          trendValue="Info"
          trendLabel="Requires backend aggregation endpoint"
          trendDirection="neutral"
        />
        <KPICard
          title="Storage Efficiency"
          value="N/A"
          icon={<Database size={20} />}
          trendValue="N/A"
          trendLabel="No capacity tracking in system"
          trendDirection="neutral"
        />
      </div>

      {/* Filters Bar */}
      <div className={styles.filtersBar}>
        <div className={styles.filtersLeft}>
          <TextInput
            placeholder="Search products..."
            iconLeft={<Search size={18} />}
            className={styles.searchInput}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <SelectInput 
            className={styles.selectInput} 
            value={categoryId} 
            onChange={(e) => setCategoryId(e.target.value)}
          >
            <option value="">All Categories</option>
            {categories.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </SelectInput>
          <SelectInput className={styles.selectInput} defaultValue="">
            <option value="" disabled>All Warehouses</option>
            {warehouses.map(wh => (
              <option key={wh.id} value={wh.id}>{wh.name}</option>
            ))}
          </SelectInput>
          <SelectInput className={styles.selectInput} defaultValue="">
            <option value="" disabled>All Statuses</option>
            <option value="in-stock">In Stock</option>
            <option value="low-stock">Low Stock</option>
            <option value="out-of-stock">Out of Stock</option>
          </SelectInput>
        </div>
        <Button variant="outline" icon={<Download size={18} />}>
          Export CSV
        </Button>
      </div>

      {/* Content */}
      <div className={styles.content}>
        {isLoading ? (
          <div>Loading products...</div>
        ) : (
            <InventoryTable 
              products={products.map((p: any) => {
                const prod = p.product || p; // Handle nested { product, totalStock } from backend
                return {
                  id: prod.id,
                  name: prod.name,
                  sku: prod.sku || '', // SKU might not exist on backend yet
                  price: prod.price || 0,
                  status: p.availability || p.status || 'OUT_OF_STOCK',
                  category: prod.category?.name || p.category?.name || 'Uncategorized',
                  totalUnits: p.totalStock ?? p.totalUnits ?? 0,
                  stockBreakdown: p.stockBreakdown ?? []
                };
              })} 
              onAdjustStock={handleAdjustStock} 
            />
        )}
      </div>

      {productToAdjust && (
        <StockAdjustmentPanel
          isOpen={isAdjustPanelOpen}
          onClose={() => setIsAdjustPanelOpen(false)}
          productId={productToAdjust.id}
          productName={productToAdjust.name}
        />
      )}
    </div>
  );
};

export const InventoryList: React.FC = () => {
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
      <InventoryListContent />
    </AppLayout>
  );
};
