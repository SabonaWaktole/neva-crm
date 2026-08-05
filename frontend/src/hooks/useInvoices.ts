import { useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { invoiceService } from '../services/invoiceService';
import { downloadBlob } from '../utils/downloadBlob';

export interface UseInvoicesOptions {
  query?: string;
  status?: string;
  clientId?: string;
  page?: number;
  limit?: number;
}

export function useInvoices() {
  const { tenantSlug } = useParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchInvoices = useCallback(async (options: UseInvoicesOptions = {}) => {
    if (!tenantSlug) throw new Error('Missing tenant context');
    setLoading(true);
    setError(null);
    try {
      return await invoiceService.fetchInvoices(tenantSlug, options);
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [tenantSlug]);

  const fetchInvoiceDetail = useCallback(async (id: string) => {
    if (!tenantSlug) throw new Error('Missing tenant context');
    setLoading(true);
    setError(null);
    try {
      return await invoiceService.fetchInvoiceDetail(tenantSlug, id);
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [tenantSlug]);

  const convertQuotationToInvoice = useCallback(async (quotationId: string, dueDate?: string) => {
    if (!tenantSlug) throw new Error('Missing tenant context');
    setLoading(true);
    setError(null);
    try {
      return await invoiceService.convertQuotationToInvoice(tenantSlug, quotationId, dueDate ? { dueDate } : undefined);
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [tenantSlug]);

  const downloadInvoicePdf = useCallback(async (id: string, reference: string, open = true) => {
    if (!tenantSlug) throw new Error('Missing tenant context');
    setLoading(true);
    setError(null);
    try {
      const blob = await invoiceService.downloadInvoicePdf(tenantSlug, id);
      downloadBlob(blob, `invoice-${reference}.pdf`, { open });
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [tenantSlug]);

  return { fetchInvoices, fetchInvoiceDetail, convertQuotationToInvoice, downloadInvoicePdf, loading, error };
}

export function useInvoiceActions() {
  const { tenantSlug } = useParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const performAction = async (id: string, action: string, payload?: any) => {
    if (!tenantSlug) throw new Error('Missing tenant context');
    setLoading(true);
    setError(null);
    try {
      return await invoiceService.performAction(tenantSlug, id, action, payload);
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    sendInvoice: (id: string) => performAction(id, 'send'),
    markInvoicePaid: (id: string) => performAction(id, 'mark-paid'),
    voidInvoice: (id: string) => performAction(id, 'void'),
    loading,
    error
  };
}
