import { apiClient } from '../api';

export const quotationService = {
  fetchQuotations: async (tenantSlug: string, params: any) => {
    const response = await apiClient.get(`/${tenantSlug}/quotations`, { params });
    return response.data;
  },
  fetchPendingApprovals: async (tenantSlug: string) => {
    const response = await apiClient.get(`/${tenantSlug}/quotations`, { params: { status: 'PENDING_APPROVAL' } });
    return response.data; // Note: Ensure backend supports status filtering or this route specifically
  },
  fetchQuotationDetail: async (tenantSlug: string, id: string) => {
    const response = await apiClient.get(`/${tenantSlug}/quotations/${id}`);
    return response.data;
  },
  createQuotation: async (tenantSlug: string, data: any) => {
    const response = await apiClient.post(`/${tenantSlug}/quotations`, data);
    return response.data;
  },
  updateQuotation: async (tenantSlug: string, id: string, data: any) => {
    const response = await apiClient.put(`/${tenantSlug}/quotations/${id}`, data);
    return response.data;
  },
  performAction: async (tenantSlug: string, id: string, action: string, data?: any) => {
    const response = await apiClient.post(`/${tenantSlug}/quotations/${id}/${action}`, data);
    return response.data;
  }
};
