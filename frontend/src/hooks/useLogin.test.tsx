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

  it('handles successful login', async () => {
    server.use(
      http.post('http://localhost:3000/api/auth/login', () => {
        return HttpResponse.json({ message: 'Login successful' });
      }),
      http.get('http://localhost:3000/api/auth/me', () => {
        return HttpResponse.json({
          user: { userId: '1', role: UserRole.STAFF, tenantId: 'tenant-1' }
        });
      })
    );

    const { result } = renderHook(() => useLogin());

    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();

    await act(async () => {
      await result.current.login('test@example.com', 'password', 'tenant-1');
    });

    expect(result.current.isLoading).toBe(false);
    expect(useAuthStore.getState().isAuthenticated).toBe(true);
    expect(useAuthStore.getState().user?.role).toBe(UserRole.STAFF);
  });

  it('handles login failure', async () => {
    server.use(
      http.post('http://localhost:3000/api/auth/login', () => {
        return HttpResponse.json({ error: 'Invalid credentials' }, { status: 401 });
      })
    );

    const { result } = renderHook(() => useLogin());

    await act(async () => {
      try {
        await result.current.login('wrong@example.com', 'wrong', 'tenant-1');
      } catch (e) {
        // Handle expected error
      }
    });

    expect(result.current.error).toBe('Invalid credentials');
    expect(result.current.isLoading).toBe(false);
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
  });
});
