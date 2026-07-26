import { useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { apiClient } from '../api';
import { extractApiErrorMessage } from '../utils/apiError';

export const DATE_FORMATS = ['MM/DD/YYYY', 'DD/MM/YYYY', 'YYYY-MM-DD'] as const;
export type DateFormat = (typeof DATE_FORMATS)[number];

export const SUPPORTED_LOCALES = ['en-US', 'en-GB'] as const;
export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];

export interface TenantSettings {
  name: string;
  requiresQuotationApproval: boolean;

  // Localization
  currency: string;
  locale: SupportedLocale;
  timezone: string;
  dateFormat: DateFormat;

  // Company profile
  registrationNumber: string | null;
  addressLine: string | null;
  addressCity: string | null;
  addressState: string | null;
  addressPostalCode: string | null;
  contactEmail: string | null;
  contactPhone: string | null;

  // Branding, saved separately on upload
  logoUrl: string | null;
  coverImageUrl: string | null;
}

export function useTenantSettings() {
  const { tenantSlug } = useParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // The router mounts this at /api/:tenantSlug/settings. It was previously
  // requested as `/settings/tenant`, which matched no route — so every load and
  // save from this page 404'd, including the quotation-approval toggle that
  // appeared to be the one working section.
  const endpoint = `/${tenantSlug}/settings`;

  const fetchSettings = useCallback(async (): Promise<TenantSettings> => {
    if (!tenantSlug) throw new Error('Missing tenant context');
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.get(endpoint);
      return response.data;
    } catch (err: unknown) {
      setError(extractApiErrorMessage(err, 'Could not load settings.'));
      throw err;
    } finally {
      setLoading(false);
    }
  }, [tenantSlug, endpoint]);

  /**
   * Partial by design, all the way to the database: sending only the changed
   * keys means an absent field is left alone rather than being cleared. The
   * endpoint returns the stored state, not an echo of the request.
   */
  const updateSettings = useCallback(
    async (payload: Partial<TenantSettings>): Promise<TenantSettings> => {
      if (!tenantSlug) throw new Error('Missing tenant context');
      setLoading(true);
      setError(null);
      try {
        const response = await apiClient.put(endpoint, payload);
        return response.data;
      } catch (err: unknown) {
        setError(extractApiErrorMessage(err, 'Could not save settings.'));
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [tenantSlug, endpoint]
  );

  return { fetchSettings, updateSettings, loading, error };
}
