import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import {
  SUPPORTED_LANGUAGES,
  DEFAULT_LANGUAGE,
  DEFAULT_NAMESPACE,
  NAMESPACES,
  isSupportedLanguage,
  type Language,
} from './config';

import enCommon from '../locales/en/common.json';
import enAuth from '../locales/en/auth.json';
import enClients from '../locales/en/clients.json';
import enAppointments from '../locales/en/appointments.json';
import enInventory from '../locales/en/inventory.json';
import enQuotations from '../locales/en/quotations.json';
import enSettings from '../locales/en/settings.json';
import enDashboard from '../locales/en/dashboard.json';

import sqCommon from '../locales/sq/common.json';
import sqAuth from '../locales/sq/auth.json';
import sqClients from '../locales/sq/clients.json';
import sqAppointments from '../locales/sq/appointments.json';
import sqInventory from '../locales/sq/inventory.json';
import sqQuotations from '../locales/sq/quotations.json';
import sqSettings from '../locales/sq/settings.json';
import sqDashboard from '../locales/sq/dashboard.json';

/**
 * Catalogues are imported statically rather than fetched at runtime.
 *
 * Two languages of UI text is a few tens of kilobytes, which is smaller than the
 * loader that would fetch them — and static imports mean there is no async gap
 * on first paint where the interface renders raw translation keys. Namespaces
 * are still separated, so switching to lazy loading later is a config change
 * rather than a restructure.
 */
export const resources = {
  en: {
    common: enCommon,
    auth: enAuth,
    clients: enClients,
    appointments: enAppointments,
    inventory: enInventory,
    quotations: enQuotations,
    settings: enSettings,
    dashboard: enDashboard,
  },
  sq: {
    common: sqCommon,
    auth: sqAuth,
    clients: sqClients,
    appointments: sqAppointments,
    inventory: sqInventory,
    quotations: sqQuotations,
    settings: sqSettings,
    dashboard: sqDashboard,
  },
} as const;

i18n.use(initReactI18next).init({
  resources,
  lng: DEFAULT_LANGUAGE,
  // English backs every other language: a key not yet translated renders the
  // English text rather than the raw key. A half-translated interface is
  // usable; one showing `settings:company.profile.title` is not.
  fallbackLng: DEFAULT_LANGUAGE,
  supportedLngs: [...SUPPORTED_LANGUAGES],
  ns: [...NAMESPACES],
  defaultNS: DEFAULT_NAMESPACE,
  interpolation: {
    // React escapes on render already; escaping here would double-encode.
    escapeValue: false,
  },
  returnNull: false,
});

/**
 * The single place the interface language is set.
 *
 * Deliberately narrow: it accepts only a supported language and ignores
 * anything else, so a stale value from an old session or a hand-edited
 * preference cannot leave the app rendering keys.
 *
 * Note what this does NOT touch: no Intl formatter, no tenant locale. Interface
 * language and formatting locale are independent settings.
 */
export function applyLanguage(language: unknown): Language {
  const next = isSupportedLanguage(language) ? language : DEFAULT_LANGUAGE;
  if (i18n.language !== next) {
    void i18n.changeLanguage(next);
  }
  // `lang` drives hyphenation, spellcheck and screen-reader pronunciation, and
  // was hard-coded to "en" in index.html.
  if (typeof document !== 'undefined') {
    document.documentElement.lang = next;
  }
  return next;
}

export default i18n;
