import { useEffect } from 'react';
import { authService } from '../services/authService';
import { useAuthStore } from '../store/useAuthStore';

/**
 * Hook to initialize auth state on app load.
 * Calls GET /me to check if the user has an active session (httpOnly cookie).
 */
export const useInitAuth = () => {
  const { setUser, setInitializing } = useAuthStore();

  useEffect(() => {
    const init = async () => {
      try {
        const user = await authService.getMe();
        setUser(user);
      } catch {
        // Not authenticated — that's fine, just leave user as null
      } finally {
        setInitializing(false);
      }
    };

    init();
  }, [setUser, setInitializing]);
};
