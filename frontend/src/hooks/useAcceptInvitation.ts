import { useState } from 'react';
import { authService } from '../services/authService';

export const useAcceptInvitation = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const acceptInvitation = async (data: {
    token: string;
    newPassword: string;
  }) => {
    setIsLoading(true);
    setError(null);
    setIsSuccess(false);
    try {
      await authService.acceptInvitation(data);
      setIsSuccess(true);
    } catch (err: any) {
      setError(err.response?.data?.error || 'An unexpected error occurred');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return { acceptInvitation, isLoading, error, isSuccess };
};
