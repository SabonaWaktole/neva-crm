import { useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { quotationService } from '../services/quotationService';

export interface UseQuotationsOptions {
  query?: string;
  status?: string;
  clientId?: string;
  page?: number;
  limit?: number;
}

export function useQuotations() {
  const { tenantSlug } = useParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchQuotations = useCallback(async (options: UseQuotationsOptions = {}) => {
    if (!tenantSlug) throw new Error('Missing tenant context');
    setLoading(true);
    setError(null);
    try {
      const result = await quotationService.fetchQuotations(tenantSlug, options);
      return result;
    } catch (err: any) {
      const message = err.response?.data?.error || err.message;
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  }, [tenantSlug]);

  const fetchQuotationDetail = useCallback(async (id: string) => {
    if (!tenantSlug) throw new Error('Missing tenant context');
    setLoading(true);
    setError(null);
    try {
      const result = await quotationService.fetchQuotationDetail(tenantSlug, id);
      return result;
    } catch (err: any) {
      const message = err.response?.data?.error || err.message;
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  }, [tenantSlug]);

  const createQuotation = async (payload: any) => {
    if (!tenantSlug) throw new Error('Missing tenant context');
    setLoading(true);
    setError(null);
    try {
      return await quotationService.createQuotation(tenantSlug, payload);
    } catch (err: any) {
      // The server's own reason (e.g. a Zod validation message, or a domain
      // rule like "Only Draft quotations can be updated") was previously
      // dropped here — `err.message` on an axios error is just the generic
      // HTTP status text ("Request failed with status code 400"), so the form
      // showed that instead of anything the user could act on.
      const message = err.response?.data?.error || err.message;
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  };

  const updateQuotation = async (id: string, payload: any) => {
    if (!tenantSlug) throw new Error('Missing tenant context');
    setLoading(true);
    setError(null);
    try {
      return await quotationService.updateQuotation(tenantSlug, id, payload);
    } catch (err: any) {
      const message = err.response?.data?.error || err.message;
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  };

  return { fetchQuotations, fetchQuotationDetail, createQuotation, updateQuotation, loading, error };
}

export function usePendingApprovals() {
  const { tenantSlug } = useParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPendingApprovals = useCallback(async () => {
    if (!tenantSlug) throw new Error('Missing tenant context');
    setLoading(true);
    setError(null);
    try {
      // The quotation list endpoint natively supports `status=PENDING_APPROVAL` via Prisma `where` clause.
      const result = await quotationService.fetchQuotations(tenantSlug, { status: 'PENDING_APPROVAL' });
      // Depending on whether it returns `{ data, total }` or just `data`, we extract appropriately.
      // Usually list returns `{ items, total }` or `{ data, total }`. Let's assume `data` based on standard backend response.
      return result.data || result.items || result;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [tenantSlug]);

  return { fetchPendingApprovals, loading, error };
}

export function useQuotationActions() {
  const { tenantSlug } = useParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const performAction = async (id: string, action: string, payload?: any) => {
    if (!tenantSlug) throw new Error('Missing tenant context');
    setLoading(true);
    setError(null);
    try {
      return await quotationService.performAction(tenantSlug, id, action, payload);
    } catch (err: any) {
      const message = err.response?.data?.error || err.message;
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  };

  return {
    submitQuotation: (id: string) => performAction(id, 'submit'),
    approveQuotation: (id: string) => performAction(id, 'approve'),
    returnQuotationToDraft: (id: string, reason: string) => performAction(id, 'return-to-draft', { reason }),
    markQuotationAccepted: (id: string) => performAction(id, 'mark-accepted'),
    markQuotationRejected: (id: string) => performAction(id, 'mark-rejected'),
    expireQuotation: (id: string) => performAction(id, 'expire'),
    loading,
    error
  };
}
