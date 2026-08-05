import { apiClient } from '../api';

export const invoiceService = {
  fetchInvoices: async (tenantSlug: string, params: any) => {
    const response = await apiClient.get(`/${tenantSlug}/invoices`, { params });
    return response.data;
  },
  fetchInvoiceDetail: async (tenantSlug: string, id: string) => {
    const response = await apiClient.get(`/${tenantSlug}/invoices/${id}`);
    return response.data;
  },
  convertQuotationToInvoice: async (tenantSlug: string, quotationId: string, data?: { dueDate?: string }) => {
    const response = await apiClient.post(`/${tenantSlug}/invoices/from-quotation/${quotationId}`, data ?? {});
    return response.data;
  },
  performAction: async (tenantSlug: string, id: string, action: string, data?: any) => {
    const response = await apiClient.post(`/${tenantSlug}/invoices/${id}/${action}`, data);
    return response.data;
  },
  /**
   * The invoice PDF has no public share link (unlike quotations), so it can
   * only be reached through the authenticated API client — a blob fetch
   * rather than `window.open(url)` against a bare URL, since a plain
   * navigation would carry no auth header/cookie the server can trust.
   */
  downloadInvoicePdf: async (tenantSlug: string, id: string): Promise<Blob> => {
    const response = await apiClient.get(`/${tenantSlug}/invoices/${id}/pdf`, {
      responseType: 'blob'
    });
    return response.data;
  }
};
