import { Tenant } from '../entities/Tenant';

/**
 * The subset of tenant state that settings can change.
 *
 * Deliberately `Partial` and deliberately typed rather than `boolean`: the
 * previous signature took a required `{ requiresQuotationApproval: boolean }`,
 * and the controller fed it `Boolean(req.body.requiresQuotationApproval)`. A
 * request body of `{}` therefore coerced `undefined` to `false` and silently
 * turned quotation approval OFF for the tenant. With a partial, an absent key
 * means "leave it alone" and cannot be confused with "set it to false".
 *
 * The company profile fields (address, contact details, registration number)
 * are absent by design — they are presentation-only and are written through
 * TenantProfileStore, not through the domain repository.
 */
export interface TenantSettingsUpdate {
  /** The company's display name. Already NOT NULL, so it can change but never clear. */
  name?: string;
  requiresQuotationApproval?: boolean;
  currency?: string;
  locale?: string;
  timezone?: string;
  dateFormat?: string;
  /** Interface language, not a formatting locale. */
  defaultLanguage?: string;
}

export interface ITenantRepository {
  findById(id: string): Promise<Tenant | null>;
  findBySlug(slug: string): Promise<Tenant | null>;
  create(tenant: Tenant): Promise<Tenant>;
  findAll(skip: number, take: number): Promise<{ items: Tenant[]; total: number }>;
  updateSettings(id: string, settings: TenantSettingsUpdate): Promise<void>;
}
