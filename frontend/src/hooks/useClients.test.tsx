// @ts-nocheck
import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import { 
  useClients, 
  useClientDetail, 
  useClientHistory, 
  useClientSettings,
  useCreateClient,
  useUpdateClient,
  useAddInteraction,
  useDefineCustomField,
  useDefineOutcomeCategory
} from './useClients';
import { server } from '../setupTests';
import { http, HttpResponse } from 'msw';
import { useAuthStore } from '../store/useAuthStore';
import { vi } from 'vitest';

vi.mock('react-router-dom', () => ({
  useParams: () => ({ tenantSlug: 'tenant-1' }),
}));

describe('useClients Hooks', () => {
  beforeEach(() => {
    useAuthStore.setState({ 
      user: { userId: 'staff-1', role: 'STAFF', tenantId: 'tenant-1', tenantSlug: 'tenant-1' }, 
      isAuthenticated: true 
    });
  });

  describe('useClients', () => {
    it('fetches clients successfully', async () => {
      server.use(
        http.get('http://localhost:3000/api/tenant-1/clients/search', ({ request }) => {
          const url = new URL(request.url);
          const name = url.searchParams.get('name');
          if (name === 'Acme') {
            return HttpResponse.json({
              items: [{ id: 'c1', name: 'Acme Corp', status: 'ACTIVE' }],
              total: 1
            });
          }
          return HttpResponse.json({ items: [], total: 0 });
        })
      );

      const { result } = renderHook(() => useClients());

      await act(async () => {
        await result.current.fetchClients({ name: 'Acme' });
      });

      expect(result.current.isLoading).toBe(false);
      expect(result.current.clients.length).toBe(1);
      expect(result.current.clients[0].name).toBe('Acme Corp');
      expect(result.current.total).toBe(1);
      expect(result.current.error).toBeNull();
    });

    it('handles fetch failure', async () => {
      server.use(
        http.get('http://localhost:3000/api/tenant-1/clients/search', () => {
          return HttpResponse.json({ error: 'Failed to fetch' }, { status: 500 });
        })
      );

      const { result } = renderHook(() => useClients());

      await act(async () => {
        await result.current.fetchClients();
      });

      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBe('Failed to fetch');
    });

    it('does not cause redundant fetches when parent re-renders with stable dependencies', async () => {
      let fetchCount = 0;
      server.use(
        http.get('http://localhost:3000/api/tenant-1/clients/search', () => {
          fetchCount++;
          return HttpResponse.json({ items: [], total: 0 });
        })
      );

      const { result, rerender } = renderHook(() => useClients());

      await act(async () => {
        await result.current.fetchClients({ status: 'ACTIVE' });
      });
      
      expect(fetchCount).toBe(1);

      // Simulate parent re-rendering
      rerender();
      rerender();

      // Ensure no additional implicit fetches were triggered by re-renders
      expect(fetchCount).toBe(1);
    });
  });

  describe('useClientDetail', () => {
    it('fetches client detail successfully', async () => {
      server.use(
        http.get('http://localhost:3000/api/tenant-1/clients/c1', () => {
          return HttpResponse.json({ id: 'c1', name: 'Acme Corp' });
        })
      );

      const { result } = renderHook(() => useClientDetail('c1'));

      await act(async () => {
        await result.current.fetchClient();
      });

      expect(result.current.isLoading).toBe(false);
      expect(result.current.client?.id).toBe('c1');
    });

    it('handles fetch failure', async () => {
      server.use(
        http.get('http://localhost:3000/api/tenant-1/clients/c1', () => {
          return HttpResponse.json({ error: 'Not Found' }, { status: 404 });
        })
      );

      const { result } = renderHook(() => useClientDetail('c1'));

      await act(async () => {
        await result.current.fetchClient();
      });

      expect(result.current.error).toBe('Not Found');
    });
  });

  describe('useClientHistory', () => {
    it('fetches history successfully', async () => {
      server.use(
        http.get('http://localhost:3000/api/tenant-1/clients/c1/history', () => {
          return HttpResponse.json({
            client: { id: 'c1', name: 'Acme Corp' },
            interactions: [{ id: 'i1', content: 'Call notes' }],
            appointments: []
          });
        })
      );

      const { result } = renderHook(() => useClientHistory('c1'));

      await act(async () => {
        await result.current.fetchHistory();
      });

      expect(result.current.history?.interactions.length).toBe(1);
    });
  });

  describe('useClientSettings', () => {
    it('fetches settings successfully', async () => {
      server.use(
        http.get('http://localhost:3000/api/tenant-1/clients/settings/custom-fields', () => {
          return HttpResponse.json([{ id: 'cf1', fieldName: 'Industry' }]);
        })
      );
      server.use(
        http.get('http://localhost:3000/api/tenant-1/clients/settings/outcome-categories', () => {
          return HttpResponse.json([{ id: 'oc1', label: 'Positive' }]);
        })
      );

      const { result } = renderHook(() => useClientSettings());

      await act(async () => {
        await result.current.fetchSettings();
      });

      expect(result.current.customFields.length).toBe(1);
      expect(result.current.outcomeCategories.length).toBe(1);
      expect(result.current.error).toBeNull();
    });
  });

  describe('useCreateClient', () => {
    it('creates client successfully', async () => {
      server.use(
        http.post('http://localhost:3000/api/tenant-1/clients', () => {
          return HttpResponse.json({ id: 'new-c1', name: 'New Corp' });
        })
      );

      const { result } = renderHook(() => useCreateClient());

      let res: any;
      await act(async () => {
        res = await result.current.createClient({ name: 'New Corp' });
      });

      expect(res.id).toBe('new-c1');
      expect(result.current.error).toBeNull();
    });

    it('handles create failure', async () => {
      server.use(
        http.post('http://localhost:3000/api/tenant-1/clients', () => {
          return HttpResponse.json({ error: 'Duplicate client' }, { status: 409 });
        })
      );

      const { result } = renderHook(() => useCreateClient());

      let caughtError;
      await act(async () => {
        try {
          await result.current.createClient({ name: 'New Corp' });
        } catch (e) {
          caughtError = e;
        }
      });
      
      expect(caughtError).toBeDefined();
      expect(result.current.error).toBe('Duplicate client');
    });
  });

  describe('useUpdateClient', () => {
    it('updates client successfully', async () => {
      server.use(
        http.put('http://localhost:3000/api/tenant-1/clients/c1', () => {
          return HttpResponse.json({ message: 'Success' });
        })
      );

      const { result } = renderHook(() => useUpdateClient());

      let res: any;
      await act(async () => {
        res = await result.current.updateClient('c1', { name: 'Updated' });
      });

      expect(res.message).toBe('Success');
    });

    it('handles update failure', async () => {
      server.use(
        http.put('http://localhost:3000/api/tenant-1/clients/c1', () => {
          return HttpResponse.json({ error: 'Update failed' }, { status: 400 });
        })
      );

      const { result } = renderHook(() => useUpdateClient());

      let caughtError;
      await act(async () => {
        try {
          await result.current.updateClient('c1', { name: 'Updated' });
        } catch (e) {
          caughtError = e;
        }
      });
      
      expect(caughtError).toBeDefined();
      expect(result.current.error).toBe('Update failed');
    });
  });

  describe('useAddInteraction', () => {
    it('adds interaction successfully', async () => {
      server.use(
        http.post('http://localhost:3000/api/tenant-1/clients/c1/interactions', () => {
          return HttpResponse.json({ id: 'i1' });
        })
      );

      const { result } = renderHook(() => useAddInteraction());

      let res: any;
      await act(async () => {
        res = await result.current.addInteraction('c1', { channel: 'NOTE', content: 'hello' });
      });

      expect(res.id).toBe('i1');
    });

    it('handles add interaction failure', async () => {
      server.use(
        http.post('http://localhost:3000/api/tenant-1/clients/c1/interactions', () => {
          return HttpResponse.json({ error: 'Invalid channel' }, { status: 400 });
        })
      );

      const { result } = renderHook(() => useAddInteraction());

      let caughtError;
      await act(async () => {
        try {
          await result.current.addInteraction('c1', { channel: 'BAD', content: 'hi' });
        } catch (e) {
          caughtError = e;
        }
      });

      expect(caughtError).toBeDefined();
      expect(result.current.error).toBe('Invalid channel');
    });
  });

  describe('useDefineCustomField', () => {
    it('defines custom field successfully', async () => {
      server.use(
        http.post('http://localhost:3000/api/tenant-1/clients/settings/custom-fields', () => {
          return HttpResponse.json({ id: 'cf1' });
        })
      );

      const { result } = renderHook(() => useDefineCustomField());

      await act(async () => {
        await result.current.defineCustomField({ fieldName: 'Test', fieldType: 'TEXT' });
      });

      expect(result.current.error).toBeNull();
    });

    it('handles define custom field failure', async () => {
      server.use(
        http.post('http://localhost:3000/api/tenant-1/clients/settings/custom-fields', () => {
          return HttpResponse.json({ error: 'Already exists' }, { status: 409 });
        })
      );

      const { result } = renderHook(() => useDefineCustomField());

      let caughtError;
      await act(async () => {
        try {
          await result.current.defineCustomField({ fieldName: 'Test', fieldType: 'TEXT' });
        } catch (e) {
          caughtError = e;
        }
      });

      expect(caughtError).toBeDefined();
      expect(result.current.error).toBe('Already exists');
    });
  });

  describe('useDefineOutcomeCategory', () => {
    it('defines outcome category successfully', async () => {
      server.use(
        http.post('http://localhost:3000/api/tenant-1/clients/settings/outcome-categories', () => {
          return HttpResponse.json({ id: 'oc1' });
        })
      );

      const { result } = renderHook(() => useDefineOutcomeCategory());

      await act(async () => {
        await result.current.defineOutcomeCategory({ label: 'Test' });
      });

      expect(result.current.error).toBeNull();
    });

    it('handles define outcome failure', async () => {
      server.use(
        http.post('http://localhost:3000/api/tenant-1/clients/settings/outcome-categories', () => {
          return HttpResponse.json({ error: 'Duplicate' }, { status: 409 });
        })
      );

      const { result } = renderHook(() => useDefineOutcomeCategory());

      let caughtError;
      await act(async () => {
        try {
          await result.current.defineOutcomeCategory({ label: 'Test' });
        } catch (e) {
          caughtError = e;
        }
      });

      expect(caughtError).toBeDefined();
      expect(result.current.error).toBe('Duplicate');
    });
  });
});
