import type { Meta, StoryObj } from '@storybook/react';
import { Tooltip } from './Tooltip';

const meta = {
  title: 'UI/Tooltip',
  component: Tooltip,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    side: {
      control: 'select',
      options: ['top', 'bottom', 'left', 'right'],
    },
  },
} satisfies Meta<typeof Tooltip>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    content: 'Edit client',
    side: 'top',
    children: <button type="button">Hover me</button>,
  },
};

export const Bottom: Story = {
  args: {
    content: 'Delete permanently',
    side: 'bottom',
    children: <button type="button">Hover me</button>,
  },
};
