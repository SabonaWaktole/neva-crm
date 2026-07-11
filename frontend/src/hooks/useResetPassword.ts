import { useState } from 'react';
import { authService } from '../services/authService';

export const useResetPassword = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const resetPassword = async (token: string, newPassword: string) => {
    setIsLoading(true);
    setError(null);
    setIsSuccess(false);
    try {
      await authService.resetPassword(token, newPassword);
      setIsSuccess(true);
    } catch (err: any) {
      setError(err.response?.data?.error || 'An unexpected error occurred');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return { resetPassword, isLoading, error, isSuccess };
};
