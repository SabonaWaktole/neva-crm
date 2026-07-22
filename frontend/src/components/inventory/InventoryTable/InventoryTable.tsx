import React from 'react';
import styles from './InventoryTable.module.css';
import { Badge } from '../../ui/Badge';
import { MoreHorizontal, Edit, Trash2 } from 'lucide-react';
import { DropdownMenu } from '../../ui/DropdownMenu';
import { MultiLocationStockIndicator } from '../../ui/MultiLocationStockIndicator/MultiLocationStockIndicator';
import type { StockBreakdown } from '../../ui/MultiLocationStockIndicator/MultiLocationStockIndicator';

export interface Product {
  id: string;
  name: string;
  sku: string;
  category: string;
  status: 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK';
  totalUnits: number;
  stockBreakdown: StockBreakdown[];
  price: number;
}

interface InventoryTableProps {
  products: Product[];
  onAdjustStock?: (product: Product) => void;
}

export const InventoryTable: React.FC<InventoryTableProps> = ({ products, onAdjustStock }) => {
  const getStatusVariant = (status: Product['status']): 'emerald' | 'amber' | 'error' | 'slate' => {
    switch (status) {
      case 'IN_STOCK':
        return 'emerald';
      case 'LOW_STOCK':
        return 'amber';
      case 'OUT_OF_STOCK':
        return 'error';
      default:
        return 'slate';
    }
  };

  const getStatusLabel = (status: Product['status']): string => {
    switch (status) {
      case 'IN_STOCK':
        return 'Available';
      case 'LOW_STOCK':
        return 'Low Stock';
      case 'OUT_OF_STOCK':
        return 'Out of Stock';
      default:
        return status;
    }
  };

  const getDropdownItems = (product: Product) => {
    const items = [
      { id: 'edit', label: 'Edit', onClick: () => console.log('Edit', product.id), icon: <Edit size={16} /> },
      { id: 'delete', label: 'Delete', onClick: () => console.log('Delete', product.id), icon: <Trash2 size={16} /> }
    ];

    if (onAdjustStock) {
      items.unshift({ id: 'adjust', label: 'Adjust Stock', onClick: () => onAdjustStock(product), icon: <MoreHorizontal size={16} /> });
    }

    return items;
  };

  return (
    <div className={styles.tableContainer}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Product Name</th>
            <th>SKU</th>
            <th>Category</th>
            <th>Status</th>
            <th>Stock Level</th>
            <th>Price</th>
            <th className={styles.actionsColumn}></th>
          </tr>
        </thead>
        <tbody>
          {products.map((product) => (
            <tr key={product.id}>
              <td className={styles.nameCell}>
                <span className={styles.productName}>{product.name}</span>
              </td>
              <td className={styles.secondaryText}>{product.sku}</td>
              <td className={styles.secondaryText}>{product.category}</td>
              <td>
                <Badge variant={getStatusVariant(product.status)}>{getStatusLabel(product.status)}</Badge>
              </td>
              <td>
                <MultiLocationStockIndicator 
                  totalUnits={product.totalUnits} 
                  breakdown={product.stockBreakdown} 
                />
              </td>
              <td className={styles.secondaryText}>
                ${Number(product.price || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </td>
              <td className={styles.actionsCell}>
                <DropdownMenu
                  trigger={<button className={styles.actionButton}><MoreHorizontal size={16} /></button>}
                  items={getDropdownItems(product)}
                  align="right"
                />
              </td>
            </tr>
          ))}
          {products.length === 0 && (
            <tr>
              <td colSpan={7} className={styles.emptyState}>
                No products found
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};
