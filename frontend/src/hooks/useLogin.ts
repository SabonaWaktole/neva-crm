import { useState } from 'react';
import { authService } from '../services/authService';
import { useAuthStore } from '../store/useAuthStore';

export const useLogin = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { setUser } = useAuthStore();

  const login = async (email: string, password: string, tenantSlug: string | null) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await authService.login(email, password, tenantSlug);
      // The token is not stored client-side: the backend sets it as an httpOnly
      // cookie, which the browser sends on subsequent requests automatically.
      const user = await authService.getMe();
      // A null user here means the credentials were accepted but the session
      // cookie did not come back to us — a cookie the browser refused to store
      // or to send, not a rejected password. Without this guard the hook
      // reports success, the page navigates, and ProtectedRoute bounces
      // straight back to /login showing no error at all: the failure is
      // invisible precisely when it is a deployment problem rather than a
      // typo. Fail loudly instead.
      if (!user) {
        throw new Error('SESSION_NOT_ESTABLISHED');
      }
      setUser(user);
      return result.tenantSlug;
    } catch (err: any) {
      let errorMessage = 'An unexpected error occurred';
      if (err?.message === 'SESSION_NOT_ESTABLISHED') {
        errorMessage =
          'Signed in, but the session could not be established. Please check that cookies are enabled and try again.';
        setError(errorMessage);
        throw err;
      }
      const data = err.response?.data;
      if (data) {
        if (data.error) {
          errorMessage = data.error;
        } else if (data.issues && Array.isArray(data.issues)) {
          errorMessage = data.issues.map((i: any) => `${i.path.join('.')}: ${i.message}`).join(', ');
        } else if (data.message) {
          errorMessage = data.message;
        }
      }
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return { login, isLoading, error };
};
