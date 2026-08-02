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
        // getSession rather than getMe: the impersonation flag has to be part of
        // session bootstrap so the "you are managing X" banner survives a
        // reload. Without it, an administrator who refreshed would be operating
        // inside a client's workspace with nothing on screen saying so.
        const { user, impersonating } = await authService.getSession();
        setUser(user, impersonating);
      } catch {
        // Not authenticated — that's fine, just leave user as null
      } finally {
        setInitializing(false);
      }
    };

    init();
  }, [setUser, setInitializing]);
};
