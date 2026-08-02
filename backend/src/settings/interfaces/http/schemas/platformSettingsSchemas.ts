import { z } from 'zod';
import { DATE_FORMATS, SUPPORTED_LOCALES, SUPPORTED_LANGUAGES } from '../../../../tenant/domain/entities/Tenant';
import { currency, timezone } from './settingsSchemas';

/**
 * The six fields a tenant's own Settings page edits — reused here rather than
 * duplicated, so "what a platform default can be" and "what a workspace's own
 * setting can be" can never validate two different things. Company identity
 * (name, address, branding) is deliberately absent from both schemas below: it
 * is a property of one business, not something a platform default or a bulk
 * apply across several businesses can mean anything for.
 */
const settingsFields = {
  requiresQuotationApproval: z.boolean().optional(),
  currency: currency.optional(),
  locale: z.enum(SUPPORTED_LOCALES).optional(),
  timezone: timezone.optional(),
  dateFormat: z.enum(DATE_FORMATS).optional(),
  defaultLanguage: z.enum(SUPPORTED_LANGUAGES).optional(),
};

/** PUT /api/platform-settings body. Every field optional — a PATCH. */
export const updatePlatformSettingsSchema = z.object(settingsFields);

/**
 * PUT /api/tenants/bulk-settings body.
 *
 * `tenantIds` non-empty is enforced here rather than left to "an empty array
 * updates nothing" — a scope the operator clearly meant to set to something
 * failing loudly is safer than it silently doing nothing.
 */
export const bulkUpdateTenantSettingsSchema = z.object({
  tenantIds: z.array(z.string().min(1)).min(1, 'Select at least one workspace.'),
  settings: z.object(settingsFields),
});

export type UpdatePlatformSettingsInput = z.infer<typeof updatePlatformSettingsSchema>;
export type BulkUpdateTenantSettingsInput = z.infer<typeof bulkUpdateTenantSettingsSchema>;
