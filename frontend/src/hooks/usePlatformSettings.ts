import { useCallback, useEffect, useState } from 'react';
import { dashboardService } from '../services/dashboardService';
import type { PlatformSettings, WorkspaceSettingsFields } from '../services/dashboardService';

/**
 * Platform-wide defaults for newly provisioned workspaces.
 *
 * Separate from `useBulkTenantSettings` below even though both PUT the same
 * field shape — they are two different actions with two different blast
 * radii, and the page keeps them as two explicit, differently-scoped
 * operations rather than one form that quietly does either depending on a
 * hidden flag.
 */
export const usePlatformSettings = () => {
  const [settings, setSettings] = useState<PlatformSettings | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSettings = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      setSettings(await dashboardService.getPlatformSettings());
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load platform settings');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const saveSettings = useCallback(
    async (patch: WorkspaceSettingsFields): Promise<PlatformSettings | null> => {
      setIsSaving(true);
      setError(null);
      try {
        const updated = await dashboardService.updatePlatformSettings(patch);
        setSettings(updated);
        return updated;
      } catch (err: any) {
        setError(err.response?.data?.error || 'Failed to save platform settings');
        return null;
      } finally {
        setIsSaving(false);
      }
    },
    []
  );

  return {
    settings,
    isLoading,
    isSaving,
    error,
    saveSettings,
    clearError: useCallback(() => setError(null), []),
  };
};

/** The platform console's "apply to selected tenants" action. */
export const useBulkTenantSettings = () => {
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const applyToTenants = useCallback(
    async (tenantIds: string[], settings: WorkspaceSettingsFields): Promise<number | null> => {
      setIsSaving(true);
      setError(null);
      try {
        const { updatedCount } = await dashboardService.bulkUpdateTenantSettings(
          tenantIds,
          settings
        );
        return updatedCount;
      } catch (err: any) {
        setError(err.response?.data?.error || 'Failed to apply settings to the selected workspaces');
        return null;
      } finally {
        setIsSaving(false);
      }
    },
    []
  );

  return {
    applyToTenants,
    isSaving,
    error,
    clearError: useCallback(() => setError(null), []),
  };
};
