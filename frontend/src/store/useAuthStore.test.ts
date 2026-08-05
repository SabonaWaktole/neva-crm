import { describe, it, expect, beforeEach } from 'vitest';
import { useAuthStore } from './useAuthStore';
import type { User, Impersonation } from './useAuthStore';

const baseUser: User = {
  userId: 'u1',
  email: 'owner@example.com',
  role: 'BUSINESS_OWNER',
  tenantId: 't1',
  tenantSlug: 'acme',
};

const impersonation: Impersonation = {
  adminEmail: 'admin@platform.com',
  tenantSlug: 'acme',
  tenantName: 'Acme',
};

describe('useAuthStore', () => {
  beforeEach(() => {
    useAuthStore.setState({ user: null, impersonating: null, isAuthenticated: false });
  });

  /*
   * This is the exact bug reported: a Super Admin impersonating a workspace
   * saves a company setting, the page mirrors the result onto the store, and
   * the "Exit to admin console" banner silently vanished — because the old
   * code path patched the user through `setUser`, which defaults
   * `impersonating` to null on every call.
   */
  it('updateUser patches the user without touching an active impersonation', () => {
    useAuthStore.getState().setUser(baseUser, impersonation);

    useAuthStore.getState().updateUser({ tenantCurrency: 'EUR' });

    const state = useAuthStore.getState();
    expect(state.user?.tenantCurrency).toBe('EUR');
    expect(state.impersonating).toEqual(impersonation);
  });

  it('updateUser is a no-op when there is no signed-in user', () => {
    useAuthStore.getState().updateUser({ tenantCurrency: 'EUR' });
    expect(useAuthStore.getState().user).toBeNull();
  });

  // setUser is for establishing a session (login, /me on load, entering or
  // exiting a workspace) — it SHOULD default impersonating to null so a stale
  // banner never survives a re-login.
  it('setUser without an explicit impersonating argument clears it', () => {
    useAuthStore.getState().setUser(baseUser, impersonation);
    expect(useAuthStore.getState().impersonating).toEqual(impersonation);

    useAuthStore.getState().setUser(baseUser);
    expect(useAuthStore.getState().impersonating).toBeNull();
  });
});
