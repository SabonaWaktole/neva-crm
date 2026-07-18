import type { Meta, StoryObj } from '@storybook/react';
import { Stepper } from './Stepper';

const meta = {
  title: 'UI/Stepper',
  component: Stepper,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
  argTypes: {
    currentStep: {
      control: { type: 'number', min: 1, max: 3 },
    },
  },
  decorators: [
    (Story) => (
      <div style={{ width: '600px', padding: '20px 40px' }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Stepper>;

export default meta;
type Story = StoryObj<typeof meta>;

const defaultSteps = [
  { id: 'org', label: 'Organization' },
  { id: 'brand', label: 'Branding' },
  { id: 'locale', label: 'Localization' },
];

export const Step1: Story = {
  args: {
    steps: defaultSteps,
    currentStep: 1,
  },
};

export const Step2: Story = {
  args: {
    steps: defaultSteps,
    currentStep: 2,
  },
};

export const Step3: Story = {
  args: {
    steps: defaultSteps,
    currentStep: 3,
  },
};
