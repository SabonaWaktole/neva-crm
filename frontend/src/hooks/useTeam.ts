import { useState, useCallback } from 'react';
import { apiClient as api } from '../api';
import { useParams } from 'react-router-dom';

export interface StaffMember {
  id: string;
  email: string;
  role: string;
  firstName?: string;
  lastName?: string;
  warehouseId?: string;
  /** Deactivated members are retained but cannot sign in. */
  isActive?: boolean;
}

export interface DeactivationImpact {
  clients: number;
  upcomingAppointments: number;
}

export interface PendingInvitation {
  id: string;
  email: string;
  role: string;
  expiresAt: string;
  warehouseId?: string;
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

  const inviteStaff = async (email: string, role: string, warehouseId?: string) => {
    if (!tenantSlug) return;
    try {
      await api.post(`/${tenantSlug}/auth/invitations`, { email, role, warehouseId });
      await fetchPendingInvitations();
    } catch (error) {
      console.error('Failed to invite staff', error);
      throw error;
    }
  };

  const updateStaffRole = async (userId: string, role: string, warehouseId?: string) => {
    if (!tenantSlug) return;
    try {
      await api.put(`/${tenantSlug}/auth/staff/${userId}`, { role, warehouseId });
      await fetchStaff();
    } catch (error) {
      console.error('Failed to update staff role', error);
      throw error;
    }
  };

  /** What the member still holds, shown before confirming deactivation. */
  const fetchDeactivationImpact = async (userId: string): Promise<DeactivationImpact> => {
    if (!tenantSlug) throw new Error('Missing tenant context');
    const response = await api.get(`/${tenantSlug}/auth/staff/${userId}/deactivation-impact`);
    return response.data;
  };

  const deactivateStaff = async (userId: string) => {
    if (!tenantSlug) throw new Error('Missing tenant context');
    try {
      await api.post(`/${tenantSlug}/auth/staff/${userId}/deactivate`);
      await fetchStaff();
    } catch (error) {
      console.error('Failed to deactivate staff member', error);
      throw error;
    }
  };

  const cancelInvitation = async (invitationId: string) => {
    if (!tenantSlug) return;
    try {
      await api.delete(`/${tenantSlug}/auth/invitations/${invitationId}`);
      await fetchPendingInvitations();
    } catch (error) {
      console.error('Failed to cancel invitation', error);
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
    inviteStaff,
    updateStaffRole,
    cancelInvitation,
    fetchDeactivationImpact,
    deactivateStaff,
  };
};
