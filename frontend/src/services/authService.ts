import { apiClient } from '../api';

export const authService = {
  login: async (email: string, password: string, tenantSlug: string | null) => {
    const url = tenantSlug ? `/${tenantSlug}/auth/login` : '/auth/login';
    const response = await apiClient.post(url, { email, password });
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
    const url = tenantSlug ? `/${tenantSlug}/auth/password-reset/request` : '/auth/password-reset/request';
    await apiClient.post(url, { email });
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
