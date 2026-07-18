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
      await authService.login(email, password, tenantSlug);
      const user = await authService.getMe();
      setUser(user);
    } catch (err: any) {
      setError(err.response?.data?.error || 'An unexpected error occurred');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return { login, isLoading, error };
};
