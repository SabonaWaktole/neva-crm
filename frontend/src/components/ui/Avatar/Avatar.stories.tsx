import type { Meta, StoryObj } from '@storybook/react';
import { Avatar } from './Avatar';

const meta = {
  title: 'UI/Avatar',
  component: Avatar,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
    },
    withBorder: {
      control: 'boolean',
    },
  },
} satisfies Meta<typeof Avatar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    size: 'md',
    src: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDCvWkAy2_-4zYEygraIqbwa4ei5r1oz-7-uJuHycnPJC1oP99O-3TxMmFu4kY80KtmoSaVO-OwPHB4KIE9VCsD4g1jZ1cwRprnJRFLjTEBTloS_tBjePlw030pl_onzdgfUEbk286b6Wbk9wFX3Z1JXpIoBvQvfGLEvIjHT5i8zAIWgfGDjV22h1_pA84IpjbYBmQwt_evFzG0EMbKyewm_wICJGuTo46vH4q0QNxah3yXmMu56Jg4PyZk0vt1xMiyoTWYPt9XyWI2',
    alt: 'User profile',
  },
};

export const WithBorder: Story = {
  args: {
    size: 'md',
    src: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDCvWkAy2_-4zYEygraIqbwa4ei5r1oz-7-uJuHycnPJC1oP99O-3TxMmFu4kY80KtmoSaVO-OwPHB4KIE9VCsD4g1jZ1cwRprnJRFLjTEBTloS_tBjePlw030pl_onzdgfUEbk286b6Wbk9wFX3Z1JXpIoBvQvfGLEvIjHT5i8zAIWgfGDjV22h1_pA84IpjbYBmQwt_evFzG0EMbKyewm_wICJGuTo46vH4q0QNxah3yXmMu56Jg4PyZk0vt1xMiyoTWYPt9XyWI2',
    alt: 'User profile',
    withBorder: true,
  },
};

export const Fallback: Story = {
  args: {
    size: 'md',
    fallback: 'AM',
  },
};
