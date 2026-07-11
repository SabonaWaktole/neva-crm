import type { Meta, StoryObj } from '@storybook/react';
import { StaffInvitationPage } from './StaffInvitationPage';

const meta = {
  title: 'Pages/Auth/StaffInvitation',
  component: StaffInvitationPage,
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta<typeof StaffInvitationPage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
