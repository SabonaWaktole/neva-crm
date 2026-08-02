import { SUPPORTED_LOCALES } from '../hooks/useTenantSettings';

/**
 * Shared between a workspace's own Settings page and the platform console's
 * Settings page (platform defaults + bulk apply) — both edit the same six
 * fields, so the picker contents must not drift between them.
 */

/**
 * The currencies offered in the picker.
 *
 * A short list rather than all 162 ISO codes: a dropdown of every currency on
 * earth is worse to use than a short one, and the server validates against the
 * full `Intl.supportedValuesOf('currency')` set regardless — so this list can
 * grow without any server change.
 */
export const CURRENCY_OPTIONS = [
  { code: 'USD', label: 'USD — US Dollar ($)' },
  { code: 'EUR', label: 'EUR — Euro (€)' },
  { code: 'GBP', label: 'GBP — British Pound (£)' },
  { code: 'CAD', label: 'CAD — Canadian Dollar ($)' },
  { code: 'AUD', label: 'AUD — Australian Dollar ($)' },
  { code: 'ETB', label: 'ETB — Ethiopian Birr (Br)' },
  { code: 'KES', label: 'KES — Kenyan Shilling (KSh)' },
  { code: 'NGN', label: 'NGN — Nigerian Naira (₦)' },
  { code: 'INR', label: 'INR — Indian Rupee (₹)' },
  { code: 'JPY', label: 'JPY — Japanese Yen (¥)' },
];

/**
 * A shortlist, not all 418 IANA zones — a dropdown of every zone on earth is
 * unusable. The server validates against the full `Intl.supportedValuesOf`
 * set, so this list can grow with no server change.
 */
export const TIMEZONE_OPTIONS = [
  'UTC',
  'Europe/Tirane',
  'Europe/London',
  'Europe/Berlin',
  'Africa/Addis_Ababa',
  'Africa/Nairobi',
  'Africa/Lagos',
  'America/New_York',
  'America/Chicago',
  'America/Los_Angeles',
  'Asia/Dubai',
  'Asia/Kolkata',
  'Asia/Tokyo',
  'Australia/Sydney',
];

export const LOCALE_LABELS: Record<(typeof SUPPORTED_LOCALES)[number], string> = {
  'en-US': 'English (United States) — 1,234.56',
  'en-GB': 'English (United Kingdom) — 1,234.56',
  'sq-AL': 'Albanian (Albania) — 1 234,56',
};
