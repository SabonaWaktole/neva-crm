import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Clock, CalendarDays, Paperclip } from 'lucide-react';
import { Tabs } from './Tabs';

const meta = {
  title: 'UI/Tabs',
  component: Tabs,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
} satisfies Meta<typeof Tabs>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { tabs: [], activeId: '', onChange: () => {} },
  render: () => {
    const [active, setActive] = useState('timeline');
    return (
      <Tabs
        label="Client sections"
        activeId={active}
        onChange={setActive}
        tabs={[
          { id: 'timeline', label: 'Timeline' },
          { id: 'appointments', label: 'Appointments' },
          { id: 'files', label: 'Files' },
        ]}
      />
    );
  },
};

export const WithCountsAndIcons: Story = {
  args: { tabs: [], activeId: '', onChange: () => {} },
  render: () => {
    const [active, setActive] = useState('timeline');
    return (
      <Tabs
        label="Client sections"
        activeId={active}
        onChange={setActive}
        tabs={[
          { id: 'timeline', label: 'Timeline', icon: <Clock size={16} />, count: 12 },
          { id: 'appointments', label: 'Appointments', icon: <CalendarDays size={16} />, count: 3 },
          { id: 'files', label: 'Files', icon: <Paperclip size={16} />, disabled: true },
        ]}
      />
    );
  },
};
