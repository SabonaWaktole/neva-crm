import type { Meta, StoryObj } from '@storybook/react';
import { Settings, ArrowRight } from 'lucide-react';
import { Button } from './Button';

const meta = {
  title: 'UI/Button',
  component: Button,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['primary', 'outline'],
    },
    fullWidth: {
      control: 'boolean',
    },
  },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {
  args: {
    children: 'Sign In',
    variant: 'primary',
  },
};

export const Outline: Story = {
  args: {
    children: 'Cancel',
    variant: 'outline',
  },
};

export const FullWidth: Story = {
  args: {
    children: 'Join Workspace',
    variant: 'primary',
    fullWidth: true,
  },
};

export const WithIconLeft: Story = {
  args: {
    children: 'Settings',
    variant: 'primary',
    icon: <Settings size={18} />,
    iconPosition: 'left',
  },
};

export const WithIconRight: Story = {
  args: {
    children: 'Continue',
    variant: 'primary',
    icon: <ArrowRight size={18} />,
    iconPosition: 'right',
  },
};
