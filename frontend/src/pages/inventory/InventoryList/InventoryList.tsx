import React from 'react';
import styles from './InventoryList.module.css';
import { Button } from '../../../components/ui/Button';
import { KPICard } from '../../../components/ui/KPICard';
import { TextInput } from '../../../components/ui/TextInput';
import { SelectInput } from '../../../components/ui/SelectInput';
import { InventoryTable } from '../../../components/inventory/InventoryTable';
import { StockAdjustmentPanel } from '../../../components/inventory/StockAdjustmentPanel/StockAdjustmentPanel';
import { useProducts, useCategories, useWarehouses } from '../../../hooks/useInventory';
import { PlusSquare, Search, Download, TrendingUp, AlertCircle, DollarSign, Database } from 'lucide-react';

export const InventoryList: React.FC = () => {
  const [searchQuery, setSearchQuery] = React.useState('');
  const [categoryId, setCategoryId] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState(''); // Not mapped to backend yet, frontend filter or ignore

  const { data: products = [], isLoading } = useProducts({ 
    query: searchQuery, 
    categoryId: categoryId || undefined 
  });
  
  const { data: categories = [] } = useCategories();
  const { data: warehouses = [] } = useWarehouses();

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
        <Button variant="primary" icon={<PlusSquare size={20} />}>
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
            products={products.map((p: any) => ({
              ...p,
              // Map backend Category object to string for the table
              category: p.category ? p.category.name : 'Uncategorized',
              totalUnits: p.totalUnits ?? 0,
              stockBreakdown: p.stockBreakdown ?? []
            }))} 
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
