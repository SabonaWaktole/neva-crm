import type { Meta, StoryObj } from '@storybook/react';
import { ResetPasswordPage } from './ResetPasswordPage';

const meta = {
  title: 'Pages/Auth/ResetPassword',
  component: ResetPasswordPage,
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta<typeof ResetPasswordPage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
