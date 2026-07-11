import type { Meta, StoryObj } from '@storybook/react';
import { SuperAdminShell } from './SuperAdminShell';

const meta = {
  title: 'Pages/Shell/SuperAdmin',
  component: SuperAdminShell,
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta<typeof SuperAdminShell>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
