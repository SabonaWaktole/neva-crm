import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { dashboardService } from '../services/dashboardService';
import { authService } from '../services/authService';
import { useAuthStore } from '../store/useAuthStore';

/**
 * Entering and leaving a client's workspace as a platform administrator.
 *
 * Both endpoints replace the session cookie server-side, which is invisible to
 * the store — so both must re-read /auth/me before navigating. Skipping that
 * would leave the app rendering the previous session's role and tenant against
 * a cookie that no longer matches, which is exactly the state the guards are
 * there to prevent.
 *
 * Kept out of useDashboard because this is session management, not data
 * fetching: it mutates who the user currently is.
 */
export const useWorkspaceSession = () => {
  const navigate = useNavigate();
  const setUser = useAuthStore((state) => state.setUser);
  const [isSwitching, setIsSwitching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshSession = useCallback(async () => {
    const { user, impersonating } = await authService.getSession();
    setUser(user, impersonating);
  }, [setUser]);

  const enterWorkspace = useCallback(
    async (tenantId: string): Promise<boolean> => {
      setIsSwitching(true);
      setError(null);
      try {
        const { tenantSlug } = await dashboardService.enterTenant(tenantId);
        await refreshSession();
        navigate(`/${tenantSlug}`);
        return true;
      } catch (err: any) {
        // The server's own message: "this workspace is suspended" is something
        // the operator needs to read, not a generic failure.
        setError(err.response?.data?.error || 'Could not open that workspace.');
        return false;
      } finally {
        setIsSwitching(false);
      }
    },
    [navigate, refreshSession]
  );

  const exitWorkspace = useCallback(async (): Promise<boolean> => {
    setIsSwitching(true);
    setError(null);
    try {
      await authService.exitWorkspace();
      await refreshSession();
      navigate('/admin/tenants');
      return true;
    } catch (err: any) {
      setError(err.response?.data?.error || 'Could not return to the admin console.');
      return false;
    } finally {
      setIsSwitching(false);
    }
  }, [navigate, refreshSession]);

  return {
    enterWorkspace,
    exitWorkspace,
    isSwitching,
    error,
    clearError: useCallback(() => setError(null), []),
  };
};
