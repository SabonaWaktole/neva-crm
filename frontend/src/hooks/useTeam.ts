import { useState, useCallback } from 'react';
import { apiClient as api } from '../api';
import { useParams } from 'react-router-dom';

export interface StaffMember {
  id: string;
  email: string;
  role: string;
  firstName?: string;
  lastName?: string;
}

export interface PendingInvitation {
  id: string;
  email: string;
  role: string;
  expiresAt: string;
}

export const useTeam = () => {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [pendingInvitations, setPendingInvitations] = useState<PendingInvitation[]>([]);
  const [loadingStaff, setLoadingStaff] = useState(false);
  const [loadingInvitations, setLoadingInvitations] = useState(false);
  const { tenantSlug } = useParams();

  const fetchStaff = useCallback(async () => {
    if (!tenantSlug) return;
    setLoadingStaff(true);
    try {
      const response = await api.get(`/${tenantSlug}/auth/staff`);
      setStaff(response.data.items || []);
    } catch (error) {
      console.error('Failed to fetch staff', error);
    } finally {
      setLoadingStaff(false);
    }
  }, [tenantSlug]);

  const fetchPendingInvitations = useCallback(async () => {
    if (!tenantSlug) return;
    setLoadingInvitations(true);
    try {
      const response = await api.get(`/${tenantSlug}/auth/invitations`);
      setPendingInvitations(response.data);
    } catch (error) {
      console.error('Failed to fetch pending invitations', error);
    } finally {
      setLoadingInvitations(false);
    }
  }, [tenantSlug]);

  const inviteStaff = async (email: string, role: string) => {
    if (!tenantSlug) return;
    try {
      await api.post(`/${tenantSlug}/auth/invitations`, { email, role });
      await fetchPendingInvitations();
    } catch (error) {
      console.error('Failed to invite staff', error);
      throw error;
    }
  };

  return {
    staff,
    pendingInvitations,
    loadingStaff,
    loadingInvitations,
    fetchStaff,
    fetchPendingInvitations,
    inviteStaff
  };
};
