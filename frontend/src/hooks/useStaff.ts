import { useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { apiClient } from '../api';

export interface StaffMember {
  id: string;
  email: string;
  role: string;
}

export const useStaff = () => {
  const { tenantSlug } = useParams();
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStaff = useCallback(async () => {
    if (!tenantSlug) return;
    setIsLoading(true);
    setError(null);
    try {
      const response = await apiClient.get(`/${tenantSlug}/auth/staff`);
      setStaff(response.data.items);
    } catch (err: any) {
      const msg = err.response?.data?.error || 'Failed to fetch staff';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, [tenantSlug]);

  return { staff, isLoading, error, fetchStaff };
};
