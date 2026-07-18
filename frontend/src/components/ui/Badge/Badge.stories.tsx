import type { Meta, StoryObj } from '@storybook/react';
import { Badge } from './Badge';

const meta = {
  title: 'UI/Badge',
  component: Badge,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['primary', 'secondary', 'outline', 'error'],
    },
  },
} satisfies Meta<typeof Badge>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Secondary: Story = {
  args: {
    children: 'Staff',
    variant: 'secondary',
  },
};

export const Primary: Story = {
  args: {
    children: 'Enterprise Tier',
    variant: 'primary',
  },
};

export const Outline: Story = {
  args: {
    children: 'Pending',
    variant: 'outline',
  },
};

export const Error: Story = {
  args: {
    children: 'Overdue',
    variant: 'error',
  },
};
