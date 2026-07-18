import { renderHook, act } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { useAcceptInvitation } from './useAcceptInvitation';
import { server } from '../setupTests';
import { http, HttpResponse } from 'msw';

describe('useAcceptInvitation hook', () => {
  it('handles successful invitation acceptance', async () => {
    server.use(
      http.post('http://localhost:3000/api/auth/invitations/accept', () => {
        return HttpResponse.json({ message: 'Invitation accepted successfully' });
      })
    );

    const { result } = renderHook(() => useAcceptInvitation());

    await act(async () => {
      await result.current.acceptInvitation({
        token: 'valid-invite-token',
        newPassword: 'Password1',
      });
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.isSuccess).toBe(true);
    expect(result.current.error).toBeNull();
  });

  it('handles expired invitation', async () => {
    server.use(
      http.post('http://localhost:3000/api/auth/invitations/accept', () => {
        return HttpResponse.json({ error: 'Invitation expired' }, { status: 400 });
      })
    );

    const { result } = renderHook(() => useAcceptInvitation());

    await act(async () => {
      try {
        await result.current.acceptInvitation({
          token: 'expired-token',
          newPassword: 'Password1',
        });
      } catch (e) {
        // Expected
      }
    });

    expect(result.current.error).toBe('Invitation expired');
    expect(result.current.isSuccess).toBe(false);
  });
});
