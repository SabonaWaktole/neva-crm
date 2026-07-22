import { apiClient } from '../api';

export interface Integration {
  id: string;
  tenantId: string;
  provider: string;
  status: 'CONNECTED' | 'DISCONNECTED';
  config: any;
  createdAt: string;
  updatedAt: string;
}

export const integrationService = {
  getIntegrations: async (tenantSlug: string): Promise<Integration[]> => {
    try {
      const response = await apiClient.get(`/${tenantSlug}/integrations`);
      return response.data.integrations;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to fetch integrations');
    }
  },

  connectIntegration: async (tenantSlug: string, provider: string, config?: any): Promise<void> => {
    try {
      await apiClient.post(`/${tenantSlug}/integrations/connect`, { provider, config });
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to connect integration');
    }
  },

  disconnectIntegration: async (tenantSlug: string, provider: string): Promise<void> => {
    try {
      await apiClient.post(`/${tenantSlug}/integrations/disconnect`, { provider });
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to disconnect integration');
    }
  }
};
