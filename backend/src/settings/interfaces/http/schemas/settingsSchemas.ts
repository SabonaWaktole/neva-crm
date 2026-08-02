import { z } from 'zod';
import { DATE_FORMATS, SUPPORTED_LOCALES, SUPPORTED_LANGUAGES } from '../../../../tenant/domain/entities/Tenant';

/**
 * Currency and timezone are validated against the runtime's own CLDR tables
 * rather than a list we maintain.
 *
 * The point is not convenience, it is that these are the *same* tables the
 * consumers use: if validation accepts a code, `Intl.NumberFormat` can format
 * it, by construction. A hand-written list can drift out of agreement with the
 * formatter; this cannot. That matters because `Intl.NumberFormat` throws
 * RangeError on an unknown currency — a typo'd code would be a crashed Reports
 * page, not a cosmetic defect.
 *
 * Computed once at module load: 162 currencies and 418 timezones on Node 24,
 * and rebuilding a Set per request would be pure waste.
 */
const SUPPORTED_CURRENCIES = new Set(Intl.supportedValuesOf('currency'));
const SUPPORTED_TIMEZONES = new Set(Intl.supportedValuesOf('timeZone'));

/**
 * Exported so the platform-settings schemas (platform defaults, and the
 * platform console's bulk apply to selected tenants) validate currency and
 * timezone against the exact same tables rather than a second
 * `Intl.supportedValuesOf` computation that could theoretically drift if the
 * two ever imported different Node builds.
 */
export const currency = z
  .string()
  .refine((v) => SUPPORTED_CURRENCIES.has(v), { message: 'Unknown currency code.' });

export const timezone = z
  .string()
  .refine((v) => SUPPORTED_TIMEZONES.has(v), { message: 'Unknown timezone.' });

/**
 * Trimmed, and an empty string is normalised to null so "cleared the field" and
 * "never filled it in" are the same stored state rather than two.
 *
 * Note these transforms run for the use case's benefit, not the middleware's:
 * validateRequest currently discards Zod's parsed output, so the use case
 * re-parses with these schemas rather than trusting req.body. See the note in
 * UpdateTenantSettingsUseCase.
 */
const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .transform((v) => (v === '' ? null : v))
    .nullable()
    .optional();

const optionalEmail = z
  .string()
  .trim()
  .transform((v) => (v === '' ? null : v))
  .nullable()
  .optional()
  .refine((v) => v === null || v === undefined || z.string().email().safeParse(v).success, {
    message: 'Must be a valid email address.',
  });

/**
 * Every field optional: a PUT carrying only `{ currency: 'GBP' }` changes only
 * the currency. Absent is never read as "set to empty".
 */
export const updateTenantSettingsSchema = z.object({
  requiresQuotationApproval: z.boolean().optional(),

  // Localization — on the domain entity.
  currency: currency.optional(),
  locale: z.enum(SUPPORTED_LOCALES).optional(),
  timezone: timezone.optional(),
  dateFormat: z.enum(DATE_FORMATS).optional(),

  // Interface language for the workspace. A separate axis from `locale`.
  defaultLanguage: z.enum(SUPPORTED_LANGUAGES).optional(),

  // Company profile — presentation-only.
  registrationNumber: optionalText(64),
  addressLine: optionalText(200),
  addressCity: optionalText(100),
  addressState: optionalText(100),
  addressPostalCode: optionalText(20),
  contactEmail: optionalEmail,
  contactPhone: optionalText(32),

  // Company name maps to the existing Tenant.name column rather than a new one.
  // Required when present: unlike the profile fields it is NOT NULL in the
  // database, so it can be changed but never cleared.
  name: z.string().trim().min(1, 'Company name cannot be empty.').max(120).optional(),
});

export type UpdateTenantSettingsInput = z.infer<typeof updateTenantSettingsSchema>;
