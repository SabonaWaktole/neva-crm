import { useState } from 'react';
import { authService } from '../services/authService';

export const useForgotPassword = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const requestReset = async (email: string, tenantSlug: string | null) => {
    setIsLoading(true);
    setError(null);
    setIsSuccess(false);
    try {
      await authService.requestPasswordReset(email, tenantSlug);
      setIsSuccess(true);
    } catch (err: any) {
      setError(err.response?.data?.error || 'An unexpected error occurred');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return { requestReset, isLoading, error, isSuccess };
};
