import type { Meta, StoryObj } from '@storybook/react';
import { OnboardingPage } from './OnboardingPage';

const meta = {
  title: 'Pages/Onboarding/BusinessOwner',
  component: OnboardingPage,
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta<typeof OnboardingPage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
