import type { Meta, StoryObj } from '@storybook/react';
import { Users, CalendarCheck, Clock, Package } from 'lucide-react';
import { KPICard } from './KPICard';

const meta = {
  title: 'UI/KPICard',
  component: KPICard,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
  argTypes: {
    trendDirection: {
      control: 'select',
      options: ['up', 'down', 'neutral'],
    },
  },
} satisfies Meta<typeof KPICard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const TrendUp: Story = {
  args: {
    title: 'Total clients',
    value: 1284,
    icon: <Users size={24} />,
    trendValue: '+12.4%',
    trendLabel: 'vs last week',
    trendDirection: 'up',
  },
};

export const TrendDown: Story = {
  args: {
    title: 'Appointments',
    value: 86,
    icon: <CalendarCheck size={24} />,
    iconColor: 'var(--color-secondary)',
    iconBgColor: 'var(--color-secondary-container)',
    trendValue: '-3.1%',
    trendLabel: 'from yesterday',
    trendDirection: 'down',
  },
};

export const WithProgress: Story = {
  args: {
    title: 'Active tenants',
    value: 72,
    icon: <Package size={24} />,
    trendValue: '+8',
    trendLabel: 'vs last month',
    trendDirection: 'up',
    progress: 72,
  },
};

export const Placeholder: Story = {
  args: {
    title: 'Open quotations',
    value: '---',
    icon: <Clock size={24} />,
    isPlaceholder: true,
    placeholderText: 'Coming soon',
  },
};

/** The four-up grid as it appears at the top of the dashboard. */
export const DashboardGrid: Story = {
  args: { title: 'Total clients', value: 0, icon: <Users size={24} /> },
  render: () => (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 24 }}>
      <KPICard
        title="Total clients"
        value={1284}
        icon={<Users size={24} />}
        trendValue="+12.4%"
        trendLabel="vs last week"
        trendDirection="up"
      />
      <KPICard
        title="Appointments"
        value={86}
        icon={<CalendarCheck size={24} />}
        iconColor="var(--color-secondary)"
        iconBgColor="var(--color-secondary-container)"
        trendValue="-3.1%"
        trendLabel="from yesterday"
        trendDirection="down"
      />
      <KPICard
        title="Open quotations"
        value="---"
        icon={<Clock size={24} />}
        isPlaceholder
        placeholderText="Coming soon"
      />
      <KPICard
        title="Inventory alerts"
        value="---"
        icon={<Package size={24} />}
        isPlaceholder
        placeholderText="Coming soon"
      />
    </div>
  ),
};
