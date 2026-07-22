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
      let errorMessage = 'An unexpected error occurred';
      const data = err.response?.data;
      if (data) {
        if (data.error) {
          errorMessage = typeof data.error === 'string' ? data.error : JSON.stringify(data.error);
        } else if (data.issues && Array.isArray(data.issues)) {
          // Zod error array
          errorMessage = data.issues.map((i: any) => `${i.path.join('.')}: ${i.message}`).join(', ');
        } else if (data.message) {
          errorMessage = typeof data.message === 'string' ? data.message : JSON.stringify(data.message);
        }
      } else if (err.message) {
        errorMessage = err.message;
      }
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return { register, isLoading, error, isSuccess, tenantSlug };
};
