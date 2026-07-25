import React from 'react';
import styles from './InventoryTable.module.css';
import { Badge } from '../../ui/Badge';
import { PackageOpen, MoreHorizontal, Edit, Trash2 } from 'lucide-react';
import { DataTable } from '../../ui/DataTable';
import type { DataTableColumn } from '../../ui/DataTable';
import { DropdownMenu } from '../../ui/DropdownMenu';
import type { DropdownMenuItemType } from '../../ui/DropdownMenu';
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
  isLoading?: boolean;
}

export const InventoryTable: React.FC<InventoryTableProps> = ({
  products,
  onAdjustStock,
  isLoading,
}) => {
  const getStatusVariant = (status: Product['status']): 'success' | 'warning' | 'error' | 'secondary' => {
    switch (status) {
      case 'IN_STOCK':
        return 'success';
      case 'LOW_STOCK':
        return 'warning';
      case 'OUT_OF_STOCK':
        return 'error';
      default:
        return 'secondary';
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
    const items: DropdownMenuItemType[] = [
      { id: 'edit', label: 'Edit', onClick: () => {}, icon: <Edit size={16} />, disabled: true, title: 'Editing products is coming soon' },
      { id: 'delete', label: 'Delete', onClick: () => {}, icon: <Trash2 size={16} />, disabled: true, title: 'Deleting products is coming soon' }
    ];

    if (onAdjustStock) {
      items.unshift({ id: 'adjust', label: 'Adjust Stock', onClick: () => onAdjustStock(product), icon: <MoreHorizontal size={16} /> });
    }

    return items;
  };

  const columns: DataTableColumn<Product>[] = [
    {
      id: 'name',
      header: 'Product Name',
      cardLabel: null,
      render: (product) => <span className={styles.productName}>{product.name}</span>,
    },
    {
      id: 'sku',
      header: 'SKU',
      nowrap: true,
      render: (product) => <span className={styles.secondaryText}>{product.sku}</span>,
    },
    {
      id: 'category',
      header: 'Category',
      render: (product) => <span className={styles.secondaryText}>{product.category}</span>,
    },
    {
      id: 'status',
      header: 'Status',
      render: (product) => (
        <Badge variant={getStatusVariant(product.status)}>{getStatusLabel(product.status)}</Badge>
      ),
    },
    {
      id: 'stock',
      header: 'Stock Level',
      render: (product) => (
        <MultiLocationStockIndicator
          totalUnits={product.totalUnits}
          breakdown={product.stockBreakdown}
        />
      ),
    },
    {
      id: 'price',
      header: 'Price',
      align: 'right',
      nowrap: true,
      render: (product) => (
        <span className={styles.secondaryText}>
          ${Number(product.price || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
        </span>
      ),
    },
    {
      id: 'actions',
      header: '',
      align: 'right',
      width: '64px',
      cardLabel: null,
      render: (product) => (
        <DropdownMenu
          trigger={<button className={styles.actionButton} aria-label="Product actions"><MoreHorizontal size={16} /></button>}
          items={getDropdownItems(product)}
          align="right"
        />
      ),
    },
  ];

  return (
    <DataTable
      columns={columns}
      rows={products}
      rowKey={(product) => product.id}
      isLoading={isLoading}
      caption="Products and stock levels"
      empty={{
        icon: <PackageOpen size={20} />,
        title: 'No products found',
        description: 'Products you add to your catalog will appear here.',
      }}
    />
  );
};
