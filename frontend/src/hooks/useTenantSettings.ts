import { useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { apiClient } from '../api';

export interface TenantSettings {
  requiresQuotationApproval: boolean;
}

export function useTenantSettings() {
  const { tenantSlug } = useParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSettings = useCallback(async (): Promise<TenantSettings> => {
    if (!tenantSlug) throw new Error('Missing tenant context');
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.get(`/${tenantSlug}/settings/tenant`);
      return response.data;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [tenantSlug]);

  const updateSettings = async (payload: Partial<TenantSettings>): Promise<TenantSettings> => {
    if (!tenantSlug) throw new Error('Missing tenant context');
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.put(`/${tenantSlug}/settings/tenant`, payload);
      return response.data;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { fetchSettings, updateSettings, loading, error };
}
