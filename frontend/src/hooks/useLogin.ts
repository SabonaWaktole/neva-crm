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
      if (result.token) {
        localStorage.setItem('token', result.token);
      }
      const user = await authService.getMe();
      setUser(user);
      return result.tenantSlug;
    } catch (err: any) {
      let errorMessage = 'An unexpected error occurred';
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
