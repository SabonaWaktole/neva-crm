import type { Meta, StoryObj } from '@storybook/react';
import { BusinessOwnerShell } from './BusinessOwnerShell';

const meta = {
  title: 'Pages/Shell/BusinessOwner',
  component: BusinessOwnerShell,
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta<typeof BusinessOwnerShell>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
