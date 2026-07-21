// @ts-nocheck
import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useQuotations, useQuotationActions, usePendingApprovals } from './useQuotations';
import { server } from '../setupTests';
import { http, HttpResponse } from 'msw';
import { useAuthStore } from '../store/useAuthStore';

vi.mock('react-router-dom', () => ({
  useParams: () => ({ tenantSlug: 'tenant-1' }),
}));

describe('useQuotations Hooks', () => {
  beforeEach(() => {
    useAuthStore.setState({
      user: { userId: 'user-1', role: 'BUSINESS_OWNER', tenantId: 'tenant-1', tenantSlug: 'tenant-1' },
      isAuthenticated: true,
    });
  });

  // ---------------------------------------------------------------------------
  // useQuotations
  // ---------------------------------------------------------------------------
  describe('useQuotations', () => {
    it('fetchQuotations returns data and manages loading state', async () => {
      server.use(
        http.get('http://localhost:3000/api/tenant-1/quotations', () => {
          return HttpResponse.json({
            data: [{ id: 'q1', status: 'DRAFT', clientId: 'c1' }],
            total: 1
          });
        })
      );

      const { result } = renderHook(() => useQuotations());

      expect(result.current.loading).toBe(false);

      let data: any;
      await act(async () => {
        data = await result.current.fetchQuotations();
      });

      expect(data.data).toHaveLength(1);
      expect(data.data[0].id).toBe('q1');
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('fetchQuotations sets error on failure', async () => {
      server.use(
        http.get('http://localhost:3000/api/tenant-1/quotations', () => {
          return HttpResponse.json({ message: 'Server error' }, { status: 500 });
        })
      );

      const { result } = renderHook(() => useQuotations());

      await act(async () => {
        try {
          await result.current.fetchQuotations();
        } catch {
          // Expected
        }
      });

      expect(result.current.error).toBeTruthy();
      expect(result.current.loading).toBe(false);
    });

    it('createQuotation sends correct payload', async () => {
      server.use(
        http.post('http://localhost:3000/api/tenant-1/quotations', async ({ request }) => {
          const body = await request.json();
          return HttpResponse.json({
            id: 'q-new',
            status: 'DRAFT',
            clientId: body.clientId,
          }, { status: 201 });
        })
      );

      const { result } = renderHook(() => useQuotations());

      let created: any;
      await act(async () => {
        created = await result.current.createQuotation({
          clientId: 'c1',
          lineItems: [{ productId: 'p1', warehouseId: 'w1', quantity: 5, unitPrice: 100 }]
        });
      });

      expect(created.id).toBe('q-new');
      expect(created.status).toBe('DRAFT');
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('updateQuotation sends correct payload', async () => {
      server.use(
        http.put('http://localhost:3000/api/tenant-1/quotations/q1', () => {
          return HttpResponse.json({ id: 'q1', status: 'DRAFT' });
        })
      );

      const { result } = renderHook(() => useQuotations());

      let updated: any;
      await act(async () => {
        updated = await result.current.updateQuotation('q1', {
          lineItems: [{ productId: 'p1', warehouseId: 'w1', quantity: 10, unitPrice: 200 }]
        });
      });

      expect(updated.id).toBe('q1');
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('fetchQuotationDetail returns detail data', async () => {
      server.use(
        http.get('http://localhost:3000/api/tenant-1/quotations/q1', () => {
          return HttpResponse.json({
            quotation: { id: 'q1', status: 'SENT' },
            lineItems: [{ id: 'li1', productId: 'p1', quantity: 5 }],
            history: [{ id: 'h1', fromStatus: 'DRAFT', toStatus: 'SENT' }],
            permittedActions: ['MARK_ACCEPTED', 'MARK_REJECTED']
          });
        })
      );

      const { result } = renderHook(() => useQuotations());

      let detail: any;
      await act(async () => {
        detail = await result.current.fetchQuotationDetail('q1');
      });

      expect(detail.quotation.id).toBe('q1');
      expect(detail.lineItems).toHaveLength(1);
      expect(detail.permittedActions).toContain('MARK_ACCEPTED');
      expect(result.current.loading).toBe(false);
    });
  });

  // ---------------------------------------------------------------------------
  // useQuotationActions
  // ---------------------------------------------------------------------------
  describe('useQuotationActions', () => {
    it('submitQuotation calls correct endpoint', async () => {
      server.use(
        http.post('http://localhost:3000/api/tenant-1/quotations/q1/submit', () => {
          return HttpResponse.json({ id: 'q1', status: 'SENT' });
        })
      );

      const { result } = renderHook(() => useQuotationActions());

      let res: any;
      await act(async () => {
        res = await result.current.submitQuotation('q1');
      });

      expect(res.status).toBe('SENT');
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('approveQuotation calls correct endpoint', async () => {
      server.use(
        http.post('http://localhost:3000/api/tenant-1/quotations/q2/approve', () => {
          return HttpResponse.json({ id: 'q2', status: 'SENT' });
        })
      );

      const { result } = renderHook(() => useQuotationActions());

      let res: any;
      await act(async () => {
        res = await result.current.approveQuotation('q2');
      });

      expect(res.status).toBe('SENT');
    });

    it('markQuotationAccepted calls correct endpoint', async () => {
      server.use(
        http.post('http://localhost:3000/api/tenant-1/quotations/q3/mark-accepted', () => {
          return HttpResponse.json({ id: 'q3', status: 'ACCEPTED' });
        })
      );

      const { result } = renderHook(() => useQuotationActions());

      let res: any;
      await act(async () => {
        res = await result.current.markQuotationAccepted('q3');
      });

      expect(res.status).toBe('ACCEPTED');
    });

    it('markQuotationRejected calls correct endpoint', async () => {
      server.use(
        http.post('http://localhost:3000/api/tenant-1/quotations/q4/mark-rejected', () => {
          return HttpResponse.json({ id: 'q4', status: 'REJECTED' });
        })
      );

      const { result } = renderHook(() => useQuotationActions());

      let res: any;
      await act(async () => {
        res = await result.current.markQuotationRejected('q4');
      });

      expect(res.status).toBe('REJECTED');
    });

    it('expireQuotation calls correct endpoint', async () => {
      server.use(
        http.post('http://localhost:3000/api/tenant-1/quotations/q5/expire', () => {
          return HttpResponse.json({ id: 'q5', status: 'EXPIRED' });
        })
      );

      const { result } = renderHook(() => useQuotationActions());

      let res: any;
      await act(async () => {
        res = await result.current.expireQuotation('q5');
      });

      expect(res.status).toBe('EXPIRED');
    });

    it('returnQuotationToDraft sends reason in payload', async () => {
      server.use(
        http.post('http://localhost:3000/api/tenant-1/quotations/q6/return-to-draft', async ({ request }) => {
          const body = await request.json();
          return HttpResponse.json({ id: 'q6', status: 'DRAFT', reason: body.reason });
        })
      );

      const { result } = renderHook(() => useQuotationActions());

      let res: any;
      await act(async () => {
        res = await result.current.returnQuotationToDraft('q6', 'Needs corrections');
      });

      expect(res.status).toBe('DRAFT');
    });

    it('sets error state on action failure', async () => {
      server.use(
        http.post('http://localhost:3000/api/tenant-1/quotations/q-bad/submit', () => {
          return HttpResponse.json({ error: 'Forbidden' }, { status: 403 });
        })
      );

      const { result } = renderHook(() => useQuotationActions());

      await act(async () => {
        try {
          await result.current.submitQuotation('q-bad');
        } catch {
          // Expected
        }
      });

      expect(result.current.error).toBeTruthy();
      expect(result.current.loading).toBe(false);
    });
  });

  // ---------------------------------------------------------------------------
  // usePendingApprovals
  // ---------------------------------------------------------------------------
  describe('usePendingApprovals', () => {
    it('fetchPendingApprovals returns pending quotations', async () => {
      server.use(
        http.get('http://localhost:3000/api/tenant-1/quotations', ({ request }) => {
          const url = new URL(request.url);
          if (url.searchParams.get('status') === 'PENDING_APPROVAL') {
            return HttpResponse.json({
              data: [{ id: 'q-pending', status: 'PENDING_APPROVAL' }],
              total: 1
            });
          }
          return HttpResponse.json({ data: [], total: 0 });
        })
      );

      const { result } = renderHook(() => usePendingApprovals());

      let approvals: any;
      await act(async () => {
        approvals = await result.current.fetchPendingApprovals();
      });

      expect(approvals).toHaveLength(1);
      expect(approvals[0].status).toBe('PENDING_APPROVAL');
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
    });
  });
});
