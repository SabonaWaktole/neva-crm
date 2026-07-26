import type { Preview } from '@storybook/react'
import '../src/index.css';
import { withI18n } from './withI18n';
import { SUPPORTED_LANGUAGES, LANGUAGE_LABELS } from '../src/i18n/config';

/**
 * The language toolbar matters more than it sounds: Albanian runs noticeably
 * longer than English, so truncation and wrapping bugs surface per-component
 * here long before they surface in a page.
 */
const preview: Preview = {
  globalTypes: {
    language: {
      description: 'Interface language',
      defaultValue: 'en',
      toolbar: {
        title: 'Language',
        icon: 'globe',
        items: SUPPORTED_LANGUAGES.map((code) => ({
          value: code,
          title: LANGUAGE_LABELS[code],
        })),
        dynamicTitle: true,
      },
    },
  },
  decorators: [withI18n],
  parameters: {
    controls: {
      matchers: {
       color: /(background|color)$/i,
       date: /Date$/i,
      },
    },
  },
}

export default preview;
