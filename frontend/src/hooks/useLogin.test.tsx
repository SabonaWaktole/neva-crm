import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import { useLogin } from './useLogin';
import { server } from '../setupTests';
import { http, HttpResponse } from 'msw';
import { useAuthStore } from '../store/useAuthStore';
import { UserRole } from '../../../backend/src/auth/domain/enums/UserRole';

describe('useLogin hook', () => {
  beforeEach(() => {
    useAuthStore.setState({ user: null, isAuthenticated: false });
  });

  it('should handle successful login', async () => {
    server.use(
      http.post('http://localhost:3000/api/auth/login', () => {
        return HttpResponse.json({ token: 'mock-token', tenantSlug: 'tenant-1' });
      }),
      http.get('http://localhost:3000/api/auth/me', () => {
        return HttpResponse.json({ user: { id: 'user-1', email: 'test@example.com', role: 'STAFF' } });
      })
    );

    const { result } = renderHook(() => useLogin());

    await act(async () => {
      const tenantSlug = await result.current.login('test@example.com', 'password', null);
      expect(tenantSlug).toBe('tenant-1');
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
    const store = useAuthStore.getState();
    expect(store.user?.id).toBe('user-1');
  });

  it('should handle login error', async () => {
    server.use(
      http.post('http://localhost:3000/api/auth/login', () => {
        return HttpResponse.json({ error: 'Invalid credentials' }, { status: 401 });
      })
    );

    const { result } = renderHook(() => useLogin());

    await act(async () => {
      try {
        await result.current.login('wrong@example.com', 'wrong', null);
      } catch (e) {
        // Handle expected error
      }
    });

    expect(result.current.error).toBe('Invalid credentials');
    expect(result.current.isLoading).toBe(false);
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
  });
});
