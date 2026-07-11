import { apiClient } from '../api';

export const authService = {
  login: async (email: string, password: string, tenantSlug: string | null) => {
    const response = await apiClient.post('/auth/login', { email, password, tenantSlug });
    return response.data;
  },

  getMe: async () => {
    const response = await apiClient.get('/auth/me');
    return response.data.user;
  },

  logout: async () => {
    await apiClient.post('/auth/logout');
  },

  requestPasswordReset: async (email: string, tenantSlug: string | null) => {
    await apiClient.post('/auth/password-reset/request', { email, tenantSlug });
  },

  resetPassword: async (token: string, newPassword: string) => {
    await apiClient.post('/auth/password-reset/reset', { token, newPassword });
  },

  registerBusiness: async (data: {
    companyName: string;
    urlSlug: string;
    ownerEmail: string;
    ownerPassword: string;
    locale?: string;
  }) => {
    const response = await apiClient.post('/auth/register', data);
    return response.data;
  },

  acceptInvitation: async (data: {
    token: string;
    newPassword: string;
  }) => {
    const response = await apiClient.post('/auth/invitations/accept', data);
    return response.data;
  },
};
