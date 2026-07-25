import type { Meta, StoryObj } from '@storybook/react';
import { PackageOpen, Plus } from 'lucide-react';
import { DataTable } from './DataTable';
import type { DataTableColumn } from './DataTable';
import { Badge } from '../Badge/Badge';
import { Button } from '../Button/Button';

interface Product {
  id: string;
  name: string;
  sku: string;
  category: string;
  status: 'Available' | 'Low stock' | 'Out of stock';
  price: number;
}

const products: Product[] = [
  { id: '1', name: 'Aurora Desk Lamp', sku: 'ADL-001', category: 'Lighting', status: 'Available', price: 129 },
  { id: '2', name: 'Meridian Office Chair', sku: 'MOC-114', category: 'Seating', status: 'Low stock', price: 749 },
  { id: '3', name: 'Cove Acoustic Panel', sku: 'CAP-320', category: 'Acoustics', status: 'Out of stock', price: 89 },
  { id: '4', name: 'Atlas Standing Desk', sku: 'ASD-908', category: 'Desks', status: 'Available', price: 1290 },
];

const statusVariant = (status: Product['status']) =>
  status === 'Available' ? 'success' : status === 'Low stock' ? 'warning' : 'error';

const columns: DataTableColumn<Product>[] = [
  {
    id: 'name',
    header: 'Product',
    render: (p) => <strong style={{ fontWeight: 500 }}>{p.name}</strong>,
    cardLabel: null,
  },
  { id: 'sku', header: 'SKU', render: (p) => p.sku, nowrap: true },
  { id: 'category', header: 'Category', render: (p) => p.category },
  {
    id: 'status',
    header: 'Status',
    render: (p) => <Badge variant={statusVariant(p.status)}>{p.status}</Badge>,
  },
  {
    id: 'price',
    header: 'Price',
    align: 'right',
    nowrap: true,
    render: (p) => `$${p.price.toLocaleString()}`,
  },
];

const meta = {
  title: 'UI/DataTable',
  component: DataTable,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
} satisfies Meta<typeof DataTable>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { columns: [], rows: [], rowKey: () => '' },
  render: () => (
    <DataTable columns={columns} rows={products} rowKey={(p) => p.id} caption="Products" />
  ),
};

export const Interactive: Story = {
  args: { columns: [], rows: [], rowKey: () => '' },
  render: () => (
    <DataTable
      columns={columns}
      rows={products}
      rowKey={(p) => p.id}
      onRowClick={(p) => console.log('clicked', p.name)}
    />
  ),
};

export const Loading: Story = {
  args: { columns: [], rows: [], rowKey: () => '' },
  render: () => <DataTable columns={columns} rows={[]} rowKey={(p) => p.id} isLoading />,
};

export const Empty: Story = {
  args: { columns: [], rows: [], rowKey: () => '' },
  render: () => (
    <DataTable
      columns={columns}
      rows={[]}
      rowKey={(p) => p.id}
      empty={{
        icon: <PackageOpen size={20} />,
        title: 'No products yet',
        description: 'Products you add to your catalog will appear here.',
        action: (
          <Button variant="primary" icon={<Plus size={18} />}>
            Add product
          </Button>
        ),
      }}
    />
  ),
};
