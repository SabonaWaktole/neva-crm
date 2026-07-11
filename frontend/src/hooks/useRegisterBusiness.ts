import { useState } from 'react';
import { authService } from '../services/authService';

export const useRegisterBusiness = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [tenantSlug, setTenantSlug] = useState<string | null>(null);

  const register = async (data: {
    companyName: string;
    urlSlug: string;
    ownerEmail: string;
    ownerPassword: string;
    locale?: string;
  }) => {
    setIsLoading(true);
    setError(null);
    setIsSuccess(false);
    try {
      const result = await authService.registerBusiness(data);
      setTenantSlug(result.tenantSlug);
      setIsSuccess(true);
    } catch (err: any) {
      setError(err.response?.data?.error || 'An unexpected error occurred');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return { register, isLoading, error, isSuccess, tenantSlug };
};
