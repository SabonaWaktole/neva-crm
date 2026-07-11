import { renderHook, act } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { useResetPassword } from './useResetPassword';
import { server } from '../setupTests';
import { http, HttpResponse } from 'msw';

describe('useResetPassword hook', () => {
  it('handles successful password reset', async () => {
    server.use(
      http.post('http://localhost:3000/api/auth/password-reset/reset', () => {
        return HttpResponse.json({ message: 'Password reset successfully' });
      })
    );

    const { result } = renderHook(() => useResetPassword());

    await act(async () => {
      await result.current.resetPassword('valid-token', 'NewPass123');
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.isSuccess).toBe(true);
    expect(result.current.error).toBeNull();
  });

  it('handles reset failure (expired token)', async () => {
    server.use(
      http.post('http://localhost:3000/api/auth/password-reset/reset', () => {
        return HttpResponse.json({ error: 'Token expired' }, { status: 400 });
      })
    );

    const { result } = renderHook(() => useResetPassword());

    await act(async () => {
      try {
        await result.current.resetPassword('expired-token', 'NewPass123');
      } catch (e) {
        // Expected
      }
    });

    expect(result.current.error).toBe('Token expired');
    expect(result.current.isSuccess).toBe(false);
  });
});
