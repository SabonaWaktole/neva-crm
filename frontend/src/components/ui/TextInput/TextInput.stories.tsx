import type { Meta, StoryObj } from '@storybook/react';
import { TextInput } from './TextInput';

const meta = {
  title: 'UI/TextInput',
  component: TextInput,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    label: { control: 'text' },
    placeholder: { control: 'text' },
    helperText: { control: 'text' },
    error: { control: 'text' },
  },
} satisfies Meta<typeof TextInput>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    label: 'Email Address',
    placeholder: 'name@company.com',
  },
};

export const WithHelperText: Story = {
  args: {
    label: 'Company Name',
    placeholder: 'Acme Corp',
    helperText: 'This will be your workspace name.',
  },
};

export const WithError: Story = {
  args: {
    label: 'Email Address',
    placeholder: 'name@company.com',
    defaultValue: 'invalid-email',
    error: 'Please enter a valid email address.',
  },
};

export const WithIconLeft: Story = {
  args: {
    label: 'Email Address',
    placeholder: 'name@company.com',
    iconLeft: <span className="material-symbols-outlined text-[18px]">mail</span>,
  },
};
