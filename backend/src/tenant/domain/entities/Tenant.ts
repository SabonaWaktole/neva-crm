/**
 * Localization values the tenant can hold.
 *
 * `currency` and `timezone` are validated at the API boundary against
 * `Intl.supportedValuesOf`, so an accepted value is by construction one the
 * formatter can render. `dateFormat` is our own closed set because there is no
 * external standard to defer to — each value must map to a formatter we write.
 *
 * See settingsSchemas.ts for the checks themselves.
 */
export const DATE_FORMATS = ['MM/DD/YYYY', 'DD/MM/YYYY', 'YYYY-MM-DD'] as const;
export type DateFormat = (typeof DATE_FORMATS)[number];

/**
 * Formatting locales we actually support, as opposed to every tag `Intl` will
 * parse. Kept deliberately small and honest: this is a BCP-47 tag used for
 * number and date *conventions* (separators, ordering), which is a different
 * concern from UI translation language.
 */
export const SUPPORTED_LOCALES = ['en-US', 'en-GB'] as const;
export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];

export const DEFAULT_CURRENCY = 'USD';
export const DEFAULT_LOCALE: SupportedLocale = 'en-US';
export const DEFAULT_TIMEZONE = 'UTC';
export const DEFAULT_DATE_FORMAT: DateFormat = 'MM/DD/YYYY';

interface TenantProps {
  id: string;
  name: string;
  urlSlug: string;
  requiresQuotationApproval?: boolean;
  currency?: string;
  locale?: string;
  timezone?: string;
  dateFormat?: string;
  createdAt: Date;
}

export class Tenant {
  public readonly id: string;
  public readonly name: string;
  public readonly urlSlug: string;
  public readonly requiresQuotationApproval: boolean;

  /**
   * Localization lives on the entity because it drives behaviour rather than
   * being merely displayed — the money formatter reads both `locale` and
   * `currency`. The company profile fields (address, contact details) are
   * deliberately NOT here: they are presentation-only, and follow the
   * logoUrl/coverImageUrl precedent of being read straight from Prisma.
   */
  public readonly currency: string;
  public readonly locale: string;
  public readonly timezone: string;
  public readonly dateFormat: string;

  public readonly createdAt: Date;

  private constructor(props: TenantProps) {
    this.id = props.id;
    this.name = props.name;
    this.urlSlug = props.urlSlug;
    this.requiresQuotationApproval = props.requiresQuotationApproval ?? true;
    // These mirror the column defaults. A tenant constructed in memory before
    // it has ever been persisted still formats money correctly.
    this.currency = props.currency ?? DEFAULT_CURRENCY;
    this.locale = props.locale ?? DEFAULT_LOCALE;
    this.timezone = props.timezone ?? DEFAULT_TIMEZONE;
    this.dateFormat = props.dateFormat ?? DEFAULT_DATE_FORMAT;
    this.createdAt = props.createdAt;
  }

  public static create(props: TenantProps): Tenant {
    return new Tenant(props);
  }
}
