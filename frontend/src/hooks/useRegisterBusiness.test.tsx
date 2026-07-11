import { renderHook, act } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { useRegisterBusiness } from './useRegisterBusiness';
import { server } from '../setupTests';
import { http, HttpResponse } from 'msw';

describe('useRegisterBusiness hook', () => {
  it('handles successful registration', async () => {
    server.use(
      http.post('http://localhost:3000/api/auth/register', () => {
        return HttpResponse.json({ message: 'Registration successful', tenantSlug: 'my-company' });
      })
    );

    const { result } = renderHook(() => useRegisterBusiness());

    await act(async () => {
      await result.current.register({
        companyName: 'My Company',
        ownerEmail: 'john@mycompany.com',
        ownerPassword: 'Password1',
        urlSlug: 'my-company',
      });
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.isSuccess).toBe(true);
    expect(result.current.tenantSlug).toBe('my-company');
    expect(result.current.error).toBeNull();
  });

  it('handles registration failure', async () => {
    server.use(
      http.post('http://localhost:3000/api/auth/register', () => {
        return HttpResponse.json({ error: 'Slug already taken' }, { status: 400 });
      })
    );

    const { result } = renderHook(() => useRegisterBusiness());

    await act(async () => {
      try {
        await result.current.register({
          companyName: 'My Company',
          ownerEmail: 'john@mycompany.com',
          ownerPassword: 'Password1',
          urlSlug: 'taken-slug',
        });
      } catch (e) {
        // Expected
      }
    });

    expect(result.current.error).toBe('Slug already taken');
    expect(result.current.isSuccess).toBe(false);
  });
});
