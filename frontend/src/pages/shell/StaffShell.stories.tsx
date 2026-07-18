import type { Meta, StoryObj } from '@storybook/react';
import { StaffShell } from './StaffShell';

const meta = {
  title: 'Pages/Shell/Staff',
  component: StaffShell,
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta<typeof StaffShell>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
