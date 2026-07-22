import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { integrationService } from '../services/integrationService';
import type { Integration } from '../services/integrationService';

export function useIntegrations() {
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const { tenantSlug } = useParams<{ tenantSlug: string }>();

  const fetchIntegrations = useCallback(async () => {
    if (!tenantSlug) return;
    try {
      setLoading(true);
      setError(null);
      const data = await integrationService.getIntegrations(tenantSlug);
      setIntegrations(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch integrations');
    } finally {
      setLoading(false);
    }
  }, [tenantSlug]);

  useEffect(() => {
    fetchIntegrations();
  }, [fetchIntegrations]);

  const connectIntegration = async (provider: string, config?: any) => {
    if (!tenantSlug) return;
    try {
      setError(null);
      await integrationService.connectIntegration(tenantSlug, provider, config);
      await fetchIntegrations(); // Refresh the list
    } catch (err: any) {
      setError(err.message || `Failed to connect ${provider}`);
      throw err;
    }
  };

  const disconnectIntegration = async (provider: string) => {
    if (!tenantSlug) return;
    try {
      setError(null);
      await integrationService.disconnectIntegration(tenantSlug, provider);
      await fetchIntegrations(); // Refresh the list
    } catch (err: any) {
      setError(err.message || `Failed to disconnect ${provider}`);
      throw err;
    }
  };

  return {
    integrations,
    loading,
    error,
    connectIntegration,
    disconnectIntegration,
    refresh: fetchIntegrations
  };
}
