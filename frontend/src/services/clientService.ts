import { apiClient } from '../api';
import type { 
  Client, 
  SearchClientsParams, 
  PaginatedResult, 
  CustomFieldDefinition,
  OutcomeCategory,
  ClientHistory,
  Interaction,
  ClientStatus
} from '../types/client';

export const clientService = {
  createClient: async (tenantSlug: string, data: { name: string; email?: string; phone?: string; status?: ClientStatus; assignedUserId?: string | null; customFieldValues?: Record<string, any> }) => {
    const response = await apiClient.post<Client>(`/${tenantSlug}/clients`, data);
    return response.data;
  },

  updateClient: async (tenantSlug: string, clientId: string, data: { name?: string; email?: string; phone?: string; status?: ClientStatus; assignedUserId?: string | null; customFieldValues?: Record<string, any> }) => {
    const response = await apiClient.put<Client>(`/${tenantSlug}/clients/${clientId}`, data);
    return response.data;
  },

  getClient: async (tenantSlug: string, clientId: string) => {
    const response = await apiClient.get<Client>(`/${tenantSlug}/clients/${clientId}`);
    return response.data;
  },

  searchClients: async (tenantSlug: string, params: SearchClientsParams) => {
    const response = await apiClient.get<PaginatedResult<Client>>(`/${tenantSlug}/clients/search`, { params });
    return response.data;
  },

  getClientHistory: async (tenantSlug: string, clientId: string) => {
    const response = await apiClient.get<ClientHistory>(`/${tenantSlug}/clients/${clientId}/history`);
    return response.data;
  },

  addInteraction: async (tenantSlug: string, clientId: string, data: { type?: string; channel: string; content: string; outcomeCategoryId?: string }) => {
    const response = await apiClient.post<Interaction>(`/${tenantSlug}/clients/${clientId}/interactions`, data);
    return response.data;
  },

  getCustomFields: async (tenantSlug: string) => {
    const response = await apiClient.get<CustomFieldDefinition[]>(`/${tenantSlug}/clients/settings/custom-fields`);
    return response.data;
  },

  defineCustomField: async (tenantSlug: string, data: { fieldName: string; fieldType: string; isRequired?: boolean }) => {
    const response = await apiClient.post<CustomFieldDefinition>(`/${tenantSlug}/clients/settings/custom-fields`, data);
    return response.data;
  },

  getOutcomeCategories: async (tenantSlug: string) => {
    const response = await apiClient.get<OutcomeCategory[]>(`/${tenantSlug}/clients/settings/outcome-categories`);
    return response.data;
  },

  defineOutcomeCategory: async (tenantSlug: string, data: { label: string }) => {
    const response = await apiClient.post<OutcomeCategory>(`/${tenantSlug}/clients/settings/outcome-categories`, data);
    return response.data;
  },
};
