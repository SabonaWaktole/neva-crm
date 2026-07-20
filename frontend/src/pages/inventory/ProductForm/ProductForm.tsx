import React, { useState } from 'react';
import { Info, DollarSign } from 'lucide-react';
import { TextInput } from '../../../components/ui/TextInput/TextInput';
import { TextareaInput } from '../../../components/ui/TextareaInput/TextareaInput';
import { SelectInput } from '../../../components/ui/SelectInput/SelectInput';
import { Button } from '../../../components/ui/Button/Button';
import { ImageUploadZone } from '../../../components/inventory/ImageUploadZone/ImageUploadZone';
import { WarehouseStockAllocation } from '../../../components/inventory/WarehouseStockAllocation/WarehouseStockAllocation';
import styles from './ProductForm.module.css';

import { useNavigate } from 'react-router-dom';
import { useCategories, useWarehouses, useCreateProduct } from '../../../hooks/useInventory';

export const ProductForm: React.FC = () => {
  const navigate = useNavigate();
  const { categories, fetchCategories } = useCategories();
  const { warehouses, fetchWarehouses } = useWarehouses();
  const { createProduct, isPending } = useCreateProduct();

  React.useEffect(() => {
    fetchCategories();
    fetchWarehouses();
  }, [fetchCategories, fetchWarehouses]);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [price, setPrice] = useState('');
  const [allocationRows, setAllocationRows] = useState<{ id: string; warehouseId: string; quantity: number }[]>([
    { id: '1', warehouseId: 'wh-1', quantity: 50 },
    { id: '2', warehouseId: 'wh-2', quantity: 0 },
  ]);



  const handleAddRow = () => {
    setAllocationRows([...allocationRows, { id: Date.now().toString(), warehouseId: '', quantity: 0 }]);
  };

  const handleChangeRow = (id: string, field: 'warehouseId' | 'quantity', value: any) => {
    setAllocationRows(allocationRows.map(row => row.id === id ? { ...row, [field]: value } : row));
  };

  const handleRemoveRow = (id: string) => {
    setAllocationRows(allocationRows.filter(row => row.id !== id));
  };

  const handleCommit = async () => {
    if (!name || !price) {
      alert("Name and Price are required.");
      return;
    }

    const initialStock = allocationRows
      .filter(r => r.warehouseId && r.quantity > 0)
      .map(r => ({ warehouseId: r.warehouseId, quantity: Number(r.quantity) }));

    try {
      await createProduct({
        name,
        description,
        categoryId: categoryId || undefined,
        price: Number(price),
        lowStockThreshold: 10,
        initialStock
      });
      navigate(-1); // Go back to inventory list
    } catch (e) {
      console.error(e);
      alert("Failed to create product");
    }
  };

  return (
    <div className={styles.pageContainer}>
      <header className={styles.header}>
        <div className={styles.breadcrumb}>
          <span className={styles.breadcrumbMuted}>Inventory Management</span>
          <span className={styles.breadcrumbSeparator}>/</span>
          <span className={styles.breadcrumbActive}>Add New Product</span>
        </div>
      </header>

      <div className={styles.scrollArea}>
        <div className={styles.contentWrapper}>
          <div className={styles.gridContainer}>
            {/* Left Column (span 8) */}
            <div className={styles.leftCol}>
              <div className={styles.card}>
                <h2 className={styles.cardTitle}>Product Information</h2>
                <div className={styles.formGroup}>
                  <TextInput 
                    label="Product Name" 
                    placeholder="e.g. Ergonomic Office Chair" 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
                <div className={styles.formGroup}>
                  <TextareaInput 
                    label="Description" 
                    placeholder="Enter detailed product description..." 
                    rows={4} 
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>
                <div className={styles.twoColGrid}>
                  <SelectInput 
                    label="Category" 
                    value={categoryId} 
                    onChange={(e) => setCategoryId(e.target.value)}
                  >
                    <option value="">Select category...</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </SelectInput>
                  <TextInput 
                    label="Base Price" 
                    type="number" 
                    placeholder="0.00"
                    iconLeft={<DollarSign size={16} />} 
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Right Column (span 4) */}
            <div className={styles.rightCol}>
              <ImageUploadZone />
              
              <div className={styles.card}>
                <h2 className={styles.cardTitle}>Metadata</h2>
                <div className={styles.metadataList}>
                  <div className={styles.metadataItem}>
                    <span className={styles.metadataLabel}>Last Edited:</span>
                    <span className={styles.metadataValue}>Today</span>
                  </div>
                  <div className={styles.metadataItem}>
                    <span className={styles.metadataLabel}>Created By:</span>
                    <span className={styles.metadataValue}>Admin</span>
                  </div>
                  <div className={styles.metadataItem}>
                    <span className={styles.metadataLabel}>SKU Auto-Gen:</span>
                    <span className={styles.statusEnabled}>ENABLED</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Row (span 12) */}
            <div className={styles.bottomRow}>
              <WarehouseStockAllocation
                rows={allocationRows}
                availableWarehouses={warehouses}
                onAddRow={handleAddRow}
                onChangeRow={handleChangeRow}
                onRemoveRow={handleRemoveRow}
              />
            </div>
          </div>
        </div>
      </div>

      <footer className={styles.footer}>
        <div className={styles.footerLeft}>
          <Info size={16} className={styles.infoIcon} />
          <span className={styles.infoText}>System auto-saves changes every 30 seconds.</span>
        </div>
        <div className={styles.footerRight}>
          <Button variant="ghost" type="button" onClick={() => navigate(-1)}>Discard Draft</Button>
          <Button variant="outline" type="button" onClick={() => navigate(-1)}>Save & Close</Button>
          <Button variant="primary" type="button" onClick={handleCommit} disabled={isPending}>
            {isPending ? 'Committing...' : 'Commit Product'}
          </Button>
        </div>
      </footer>
    </div>
  );
};
