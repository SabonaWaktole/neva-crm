import type { Meta, StoryObj } from '@storybook/react';
import { AuthLayout } from './AuthLayout';
import { TextInput } from '../../ui/TextInput/TextInput';
import { PasswordInput } from '../../ui/PasswordInput/PasswordInput';
import { Button } from '../../ui/Button/Button';

const meta = {
  title: 'Layout/AuthLayout',
  component: AuthLayout,
  parameters: {
    layout: 'fullscreen', // AuthLayout uses min-height: 100vh
  },
  tags: ['autodocs'],
} satisfies Meta<typeof AuthLayout>;

export default meta;
type Story = StoryObj<typeof meta>;

export const LoginExample: Story = {
  args: {
    title: 'Nexus CRM',
    subtitle: 'Sign in to your workspace',
    logoIcon: <span className="material-symbols-outlined text-[32px] text-primary">hub</span>,
    children: (
      <form style={{ display: 'flex', flexDirection: 'column', gap: '16px' }} onSubmit={(e) => e.preventDefault()}>
        <TextInput label="Email" placeholder="name@company.com" />
        <PasswordInput label="Password" placeholder="••••••••" />
        <div style={{ paddingTop: '8px' }}>
          <Button fullWidth>Sign In</Button>
        </div>
      </form>
    ),
  },
};
