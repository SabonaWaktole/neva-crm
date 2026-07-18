import type { Meta, StoryObj } from '@storybook/react';
import { Card } from './Card';

const meta = {
  title: 'UI/Card',
  component: Card,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    padding: {
      control: 'select',
      options: ['none', 'sm', 'md', 'lg', 'xl', '2xl'],
    },
    glass: {
      control: 'boolean',
    },
  },
} satisfies Meta<typeof Card>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    padding: 'xl',
    children: (
      <div style={{ width: 300, textAlign: 'center' }}>
        <h2 style={{ marginTop: 0 }}>Login</h2>
        <p>Please enter your credentials to continue.</p>
      </div>
    ),
  },
};

export const Glass: Story = {
  parameters: {
    backgrounds: {
      default: 'dark',
      values: [
        { name: 'dark', value: '#1a1a1a' },
      ],
    },
  },
  args: {
    padding: 'xl',
    glass: true,
    children: (
      <div style={{ width: 300, textAlign: 'center' }}>
        <h2 style={{ marginTop: 0 }}>Join Workspace</h2>
        <p>Accept your invitation.</p>
      </div>
    ),
  },
};
