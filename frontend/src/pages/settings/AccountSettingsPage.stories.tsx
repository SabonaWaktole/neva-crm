import type { Meta, StoryObj } from '@storybook/react';
import { AccountSettingsPage } from './AccountSettingsPage';

const meta = {
  title: 'Pages/Settings/Account',
  component: AccountSettingsPage,
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta<typeof AccountSettingsPage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
