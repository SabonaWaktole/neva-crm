import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import { useDashboardMetrics, useActivityFeed, useTenants } from './useDashboard';
import { server } from '../setupTests';
import { http, HttpResponse } from 'msw';
import { useAuthStore } from '../store/useAuthStore';

describe('useDashboard Hooks', () => {
  beforeEach(() => {
    useAuthStore.setState({ 
      user: { userId: 'bo-1', role: 'BUSINESS_OWNER', tenantId: 'tenant-1', tenantSlug: 'tenant-1' }, 
      isAuthenticated: true 
    });
  });

  describe('useDashboardMetrics', () => {
    it('fetches metrics successfully', async () => {
      server.use(
        http.get('http://localhost:3000/api/tenant-1/dashboard/metrics', () => {
          return HttpResponse.json({
            totalClients: 156,
            totalClientsLastWeek: 140
          });
        })
      );

      const { result } = renderHook(() => useDashboardMetrics());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.metrics?.totalClients).toBe(156);
      expect(result.current.metrics?.totalClientsLastWeek).toBe(140);
      expect(result.current.error).toBeNull();
    });

    it('handles fetch failure', async () => {
      server.use(
        http.get('http://localhost:3000/api/tenant-1/dashboard/metrics', () => {
          return HttpResponse.json({ error: 'Failed to fetch metrics' }, { status: 500 });
        })
      );

      const { result } = renderHook(() => useDashboardMetrics());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.error).toBe('Failed to fetch metrics');
    });
  });

  describe('useActivityFeed', () => {
    it('fetches activity feed with correct limit', async () => {
      server.use(
        http.get('http://localhost:3000/api/tenant-1/dashboard/feed', ({ request }) => {
          const url = new URL(request.url);
          const limit = url.searchParams.get('limit');
          if (limit === '5') {
            return HttpResponse.json([
              {
                id: 'evt-1',
                type: 'CLIENT_CREATED',
                description: 'Client Added',
                timestamp: '2023-10-24T10:00:00.000Z',
                actor: { id: 'u1', name: 'Alex Carter' }
              }
            ]);
          }
          return HttpResponse.json([]);
        })
      );

      const { result } = renderHook(() => useActivityFeed(5));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.activities.length).toBe(1);
      expect(result.current.activities[0].id).toBe('evt-1');
      expect(result.current.error).toBeNull();
    });
  });

  describe('useTenants', () => {
    beforeEach(() => {
      useAuthStore.setState({ 
        user: { userId: 'su-1', role: 'SUPER_ADMIN', tenantId: 'system', tenantSlug: 'system' }, 
        isAuthenticated: true 
      });
    });

    it('fetches paginated tenants successfully', async () => {
      server.use(
        http.get('http://localhost:3000/api/tenants', ({ request }) => {
          const url = new URL(request.url);
          const skip = url.searchParams.get('skip');
          const take = url.searchParams.get('take');
          
          if (skip === '0' && take === '50') {
            return HttpResponse.json({
              items: [
                { id: 't-1', name: 'Acme Corp', urlSlug: 'acme', createdAt: '2023-10-01T00:00:00.000Z' }
              ],
              total: 1
            });
          }
          return HttpResponse.json({ items: [], total: 0 });
        })
      );

      const { result } = renderHook(() => useTenants(0, 50));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.tenants.length).toBe(1);
      expect(result.current.total).toBe(1);
      expect(result.current.tenants[0].name).toBe('Acme Corp');
      expect(result.current.error).toBeNull();
    });

    it('prevents infinite loops when dependency array runs multiple renders', async () => {
      let fetchCount = 0;
      server.use(
        http.get('http://localhost:3000/api/tenants', () => {
          fetchCount++;
          return HttpResponse.json({ items: [], total: 0 });
        })
      );

      const { result, rerender } = renderHook(
        ({ skip, take }) => useTenants(skip, take),
        { initialProps: { skip: 0, take: 50 } }
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(fetchCount).toBe(1);

      // Re-render with same primitives
      rerender({ skip: 0, take: 50 });
      rerender({ skip: 0, take: 50 });

      // Count should still be 1 (useEffect dependencies haven't changed)
      expect(fetchCount).toBe(1);
    });
  });
});
