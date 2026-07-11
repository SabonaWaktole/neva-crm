import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import { useLogout } from './useLogout';
import { server } from '../setupTests';
import { http, HttpResponse } from 'msw';
import { useAuthStore } from '../store/useAuthStore';
import { UserRole } from '../../../backend/src/auth/domain/enums/UserRole';

describe('useLogout hook', () => {
  beforeEach(() => {
    useAuthStore.setState({
      user: { userId: '1', role: UserRole.STAFF, tenantId: 'tenant-1' },
      isAuthenticated: true,
    });
  });

  it('clears auth state on logout', async () => {
    server.use(
      http.post('http://localhost:3000/api/auth/logout', () => {
        return HttpResponse.json({ message: 'Logged out successfully' });
      })
    );

    const { result } = renderHook(() => useLogout());

    await act(async () => {
      await result.current.logout();
    });

    expect(useAuthStore.getState().isAuthenticated).toBe(false);
    expect(useAuthStore.getState().user).toBeNull();
  });
});
