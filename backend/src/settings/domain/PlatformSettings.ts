import {
  DATE_FORMATS,
  DateFormat,
  DEFAULT_CURRENCY,
  DEFAULT_DATE_FORMAT,
  DEFAULT_LANGUAGE,
  DEFAULT_LOCALE,
  DEFAULT_TIMEZONE,
  Language,
  SUPPORTED_LANGUAGES,
  SUPPORTED_LOCALES,
  SupportedLocale,
} from '../../tenant/domain/entities/Tenant';

export interface PlatformSettingsProps {
  requiresQuotationApproval: boolean;
  currency: string;
  locale: string;
  timezone: string;
  dateFormat: string;
  defaultLanguage: string;
  /** Null until the row has ever been saved — see `defaults()`. */
  updatedAt: Date | null;
}

export type PlatformSettingsPatch = Partial<Omit<PlatformSettingsProps, 'updatedAt'>>;

/**
 * The platform's default values for a NEWLY PROVISIONED workspace.
 *
 * Sibling to `NotificationSettings` in shape and in the reason it exists: a
 * platform that has never touched this page is not misconfigured, it is on
 * `defaults()`, which is exactly what `Tenant.create()` already assumes when no
 * override is given. That is what lets this feature ship with nothing to
 * backfill and no change in behaviour for a platform admin who never opens the
 * settings page.
 *
 * These values reuse the exact enums and defaults `Tenant` itself uses
 * (`SUPPORTED_LOCALES`, `DATE_FORMATS`, `SUPPORTED_LANGUAGES`, ...) rather than
 * a parallel set, so "what a new workspace can be created with" and "what this
 * page can set as the default" can never drift apart.
 *
 * Deliberately inert once a workspace exists: nothing reads this row except
 * `CreateTenantWithOwnerUseCase`, at the single moment a tenant is created. See
 * the schema comment on the `PlatformSettings` model for why that boundary is
 * load-bearing, not incidental.
 */
export class PlatformSettings {
  readonly requiresQuotationApproval: boolean;
  readonly currency: string;
  readonly locale: string;
  readonly timezone: string;
  readonly dateFormat: string;
  readonly defaultLanguage: string;
  readonly updatedAt: Date | null;

  private constructor(props: PlatformSettingsProps) {
    this.requiresQuotationApproval = props.requiresQuotationApproval;
    this.currency = props.currency;
    this.locale = props.locale;
    this.timezone = props.timezone;
    this.dateFormat = props.dateFormat;
    this.defaultLanguage = props.defaultLanguage;
    this.updatedAt = props.updatedAt;
  }

  static defaults(): PlatformSettings {
    return new PlatformSettings({
      requiresQuotationApproval: true,
      currency: DEFAULT_CURRENCY,
      locale: DEFAULT_LOCALE,
      timezone: DEFAULT_TIMEZONE,
      dateFormat: DEFAULT_DATE_FORMAT,
      defaultLanguage: DEFAULT_LANGUAGE,
      updatedAt: null,
    });
  }

  static fromPersistence(props: {
    requiresQuotationApproval: boolean;
    currency: string;
    locale: string;
    timezone: string;
    dateFormat: string;
    defaultLanguage: string;
    updatedAt: Date;
  }): PlatformSettings {
    return new PlatformSettings(props);
  }

  /** Apply a patch, validating the RESULT — see NotificationSettings.withPatch for why. */
  withPatch(patch: PlatformSettingsPatch): PlatformSettings {
    const next = new PlatformSettings({
      requiresQuotationApproval: patch.requiresQuotationApproval ?? this.requiresQuotationApproval,
      currency: patch.currency ?? this.currency,
      locale: patch.locale ?? this.locale,
      timezone: patch.timezone ?? this.timezone,
      dateFormat: patch.dateFormat ?? this.dateFormat,
      defaultLanguage: patch.defaultLanguage ?? this.defaultLanguage,
      updatedAt: this.updatedAt,
    });
    next.assertValid();
    return next;
  }

  private assertValid(): void {
    if (!SUPPORTED_LOCALES.includes(this.locale as SupportedLocale)) {
      throw new InvalidPlatformSettingsError(`Unsupported locale: ${this.locale}`);
    }
    if (!DATE_FORMATS.includes(this.dateFormat as DateFormat)) {
      throw new InvalidPlatformSettingsError(`Unsupported date format: ${this.dateFormat}`);
    }
    if (!SUPPORTED_LANGUAGES.includes(this.defaultLanguage as Language)) {
      throw new InvalidPlatformSettingsError(`Unsupported language: ${this.defaultLanguage}`);
    }
    // Currency and timezone are checked against Intl's own tables at the HTTP
    // boundary (see platformSettingsSchemas.ts), the same way tenant settings
    // are — there is no cheaper closed list to check them against here.
  }

  toJSON() {
    return {
      requiresQuotationApproval: this.requiresQuotationApproval,
      currency: this.currency,
      locale: this.locale,
      timezone: this.timezone,
      dateFormat: this.dateFormat,
      defaultLanguage: this.defaultLanguage,
      updatedAt: this.updatedAt,
    };
  }
}

export class InvalidPlatformSettingsError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidPlatformSettingsError';
  }
}
