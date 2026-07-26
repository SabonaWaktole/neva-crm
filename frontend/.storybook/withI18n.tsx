import React, { useEffect } from 'react';
import { I18nextProvider } from 'react-i18next';
import i18n, { applyLanguage } from '../src/i18n';

/**
 * Wraps every story in the i18n provider and applies the language chosen in the
 * toolbar, so all 22 story files stay unaware that i18n exists.
 *
 * Lives in its own module rather than in preview.tsx because a file that
 * exports both a component and configuration breaks fast refresh.
 */
const I18nDecorator = ({
  language,
  children,
}: {
  language: string;
  children: React.ReactNode;
}) => {
  useEffect(() => {
    applyLanguage(language);
  }, [language]);

  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>;
};

export const withI18n = (Story: any, context: any) => (
  <I18nDecorator language={context.globals.language ?? 'en'}>
    <Story />
  </I18nDecorator>
);
