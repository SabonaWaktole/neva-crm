import React from 'react';
import {
  Archive,
  ArchiveRestore,
  Edit,
  ImageOff,
  MoreHorizontal,
  PackageOpen,
  SlidersHorizontal,
  Trash2,
} from 'lucide-react';
import styles from './InventoryTable.module.css';
import { useMoneyFormat } from '../../../hooks/useMoneyFormat';
import { Badge } from '../../ui/Badge';
import { DataTable } from '../../ui/DataTable';
import type { DataTableColumn, DataTableSelection, DataTableSort } from '../../ui/DataTable';
import { DropdownMenu } from '../../ui/DropdownMenu';
import type { DropdownMenuItemType } from '../../ui/DropdownMenu';
import { MultiLocationStockIndicator } from '../../ui/MultiLocationStockIndicator/MultiLocationStockIndicator';
import { resolveMediaUrl } from '../../../services/mediaService';
import { useStatusLabel } from '../../../hooks/useStatusLabel';
import type { Product, ProductStatus } from '../../../types/inventory';

export interface InventoryTableProps {
  products: Product[];
  isLoading?: boolean;
  sort?: DataTableSort;
  selection?: DataTableSelection;
  onEdit?: (product: Product) => void;
  onAdjustStock?: (product: Product) => void;
  onToggleArchive?: (product: Product) => void;
  onDelete?: (product: Product) => void;
  emptyAction?: React.ReactNode;
  /** Shown when the empty state is the result of filters rather than an empty catalogue. */
  isFiltered?: boolean;
}

const STATUS_VARIANT: Record<ProductStatus, 'success' | 'warning' | 'error' | 'secondary'> = {
  IN_STOCK: 'success',
  LOW_STOCK: 'warning',
  OUT_OF_STOCK: 'error',
  ARCHIVED: 'secondary',
};

export const InventoryTable: React.FC<InventoryTableProps> = ({
  products,
  isLoading,
  sort,
  selection,
  onEdit,
  onAdjustStock,
  onToggleArchive,
  onDelete,
  emptyAction,
  isFiltered = false,
}) => {
  const { format: formatMoney } = useMoneyFormat();
  const statusLabel = useStatusLabel();

  const buildMenu = (product: Product): DropdownMenuItemType[] => {
    const items: DropdownMenuItemType[] = [];

    if (onEdit) {
      items.push({ id: 'edit', label: 'Edit', onClick: () => onEdit(product), icon: <Edit size={16} /> });
    }
    if (onAdjustStock) {
      items.push({
        id: 'adjust',
        label: 'Adjust Stock',
        onClick: () => onAdjustStock(product),
        icon: <SlidersHorizontal size={16} />,
      });
    }
    if (onToggleArchive) {
      items.push({
        id: 'archive',
        label: product.isArchived ? 'Restore' : 'Archive',
        onClick: () => onToggleArchive(product),
        icon: product.isArchived ? <ArchiveRestore size={16} /> : <Archive size={16} />,
      });
    }
    if (onDelete) {
      items.push({
        id: 'delete',
        label: 'Delete',
        onClick: () => onDelete(product),
        icon: <Trash2 size={16} />,
        danger: true,
      });
    }

    return items;
  };

  const columns: DataTableColumn<Product>[] = [
    {
      id: 'name',
      header: 'Product',
      sortable: true,
      cardLabel: null,
      render: (product) => {
        const primary = product.images[0];
        return (
          <div className={styles.productCell}>
            {primary ? (
              <img
                className={styles.thumb}
                src={resolveMediaUrl(primary.url)}
                srcSet={primary.srcSet}
                alt=""
                loading="lazy"
              />
            ) : (
              <span className={styles.thumbPlaceholder} aria-hidden="true">
                <ImageOff size={15} />
              </span>
            )}
            <span className={styles.productText}>
              <span className={styles.productName}>{product.name}</span>
              {product.brand && <span className={styles.productBrand}>{product.brand}</span>}
            </span>
          </div>
        );
      },
    },
    {
      id: 'sku',
      header: 'SKU',
      nowrap: true,
      sortable: true,
      render: (product) => (
        <span className={styles.mono}>{product.sku || '—'}</span>
      ),
    },
    {
      id: 'category',
      header: 'Category',
      render: (product) => (
        <span className={styles.secondaryText}>{product.categoryName ?? 'Uncategorised'}</span>
      ),
    },
    {
      id: 'tags',
      header: 'Tags',
      hideOnCard: true,
      render: (product) =>
        product.tags.length === 0 ? (
          <span className={styles.secondaryText}>—</span>
        ) : (
          <span className={styles.tagList}>
            {/* Two tags plus a count keeps the column from setting the table's
                width while still showing what a product is filed under. */}
            {product.tags.slice(0, 2).map((tag) => (
              <span key={tag} className={styles.tag}>
                {tag}
              </span>
            ))}
            {product.tags.length > 2 && (
              <span className={styles.tagMore} title={product.tags.slice(2).join(', ')}>
                +{product.tags.length - 2}
              </span>
            )}
          </span>
        ),
    },
    {
      id: 'status',
      header: 'Status',
      render: (product) => (
        <Badge variant={STATUS_VARIANT[product.status]}>
          {statusLabel.product(product.status)}
        </Badge>
      ),
    },
    {
      id: 'stock',
      header: 'Stock Level',
      sortable: true,
      render: (product) => (
        <MultiLocationStockIndicator
          totalUnits={product.totalUnits}
          breakdown={product.stockBreakdown.map((entry) => ({
            warehouseName: entry.warehouseName,
            quantity: entry.quantity,
          }))}
        />
      ),
    },
    {
      id: 'price',
      header: 'Price',
      align: 'right',
      nowrap: true,
      sortable: true,
      render: (product) => <span className={styles.money}>{formatMoney(product.price)}</span>,
    },
    {
      id: 'cost',
      header: 'Cost',
      align: 'right',
      nowrap: true,
      sortable: true,
      hideOnCard: true,
      render: (product) => <span className={styles.money}>{formatMoney(product.cost)}</span>,
    },
    {
      id: 'actions',
      header: '',
      align: 'right',
      width: '64px',
      cardLabel: null,
      render: (product) => {
        const items = buildMenu(product);
        if (items.length === 0) return null;
        return (
          <DropdownMenu
            trigger={
              <button
                className={styles.actionButton}
                aria-label={`Actions for ${product.name}`}
                onClick={(event) => event.stopPropagation()}
              >
                <MoreHorizontal size={16} />
              </button>
            }
            items={items}
            align="right"
          />
        );
      },
    },
  ];

  return (
    <DataTable
      columns={columns}
      rows={products}
      rowKey={(product) => product.id}
      isLoading={isLoading}
      sort={sort}
      selection={selection}
      caption="Products and stock levels"
      empty={{
        icon: <PackageOpen size={20} />,
        title: isFiltered ? 'No products match these filters' : 'No products yet',
        description: isFiltered
          ? 'Try clearing a filter or searching for something else.'
          : 'Products you add to your catalogue will appear here.',
        action: emptyAction,
      }}
    />
  );
};
