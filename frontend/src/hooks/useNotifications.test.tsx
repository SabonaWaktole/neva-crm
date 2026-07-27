import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import React from 'react';
import { useNotifications } from './useNotifications';
import { apiClient } from '../api';

vi.mock('../api', () => ({
  apiClient: { get: vi.fn(), patch: vi.fn() },
}));

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <MemoryRouter initialEntries={['/acme/dashboard']}>
    <Routes>
      <Route path="/:tenantSlug/dashboard" element={<>{children}</>} />
    </Routes>
  </MemoryRouter>
);

describe('useNotifications', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (apiClient.get as any).mockResolvedValue({
      data: {
        items: [
          { id: 'n1', type: 'CLIENT_ASSIGNED', params: {}, actorUserId: 'u1', entityType: 'CLIENT', entityId: 'c1', readAt: null, createdAt: '2026-07-27T10:00:00Z' },
        ],
        unreadCount: 1,
      },
    });
    (apiClient.patch as any).mockResolvedValue({ data: {} });
  });

  afterEach(() => vi.useRealTimers());

  it('loads notifications on mount', async () => {
    const { result } = renderHook(() => useNotifications(0), { wrapper });

    await waitFor(() => expect(result.current.items).toHaveLength(1));
    expect(result.current.unreadCount).toBe(1);
    expect(apiClient.get).toHaveBeenCalledWith('/acme/notifications');
  });

  it('polls on the configured interval', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    renderHook(() => useNotifications(1000), { wrapper });

    await waitFor(() => expect(apiClient.get).toHaveBeenCalledTimes(1));
    await act(async () => {
      await vi.advanceTimersByTimeAsync(3000);
    });

    expect((apiClient.get as any).mock.calls.length).toBeGreaterThanOrEqual(3);
  });

  it('does not poll when the interval is zero', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    renderHook(() => useNotifications(0), { wrapper });

    await waitFor(() => expect(apiClient.get).toHaveBeenCalledTimes(1));
    await act(async () => {
      await vi.advanceTimersByTimeAsync(10_000);
    });

    expect(apiClient.get).toHaveBeenCalledTimes(1);
  });

  it('drops the badge immediately when marking read, before the server answers', async () => {
    let resolvePatch: (v: unknown) => void = () => {};
    (apiClient.patch as any).mockReturnValue(new Promise((res) => { resolvePatch = res; }));

    const { result } = renderHook(() => useNotifications(0), { wrapper });
    await waitFor(() => expect(result.current.items).toHaveLength(1));

    act(() => { result.current.markRead('n1'); });

    // The optimistic update is the point: a click must feel instant.
    await waitFor(() => expect(result.current.unreadCount).toBe(0));
    expect(result.current.items[0].readAt).not.toBeNull();

    resolvePatch({ data: {} });
  });

  it('re-syncs from the server when marking read fails', async () => {
    const { result } = renderHook(() => useNotifications(0), { wrapper });
    await waitFor(() => expect(result.current.items).toHaveLength(1));
    (apiClient.patch as any).mockRejectedValue(new Error('nope'));
    vi.spyOn(console, 'error').mockImplementation(() => {});

    await act(async () => { await result.current.markRead('n1'); });

    // Rather than leaving the optimistic guess in place.
    expect(apiClient.get).toHaveBeenCalledTimes(2);
  });

  it('keeps the previous list when a poll fails', async () => {
    const { result } = renderHook(() => useNotifications(0), { wrapper });
    await waitFor(() => expect(result.current.items).toHaveLength(1));

    (apiClient.get as any).mockRejectedValue(new Error('offline'));
    vi.spyOn(console, 'error').mockImplementation(() => {});
    await act(async () => { await result.current.fetchNotifications(); });

    // Blanking the bell would read as "all caught up", which is a specific
    // and false claim to make on a network error.
    expect(result.current.items).toHaveLength(1);
    expect(result.current.unreadCount).toBe(1);
  });

  it('clears the count when marking everything read', async () => {
    const { result } = renderHook(() => useNotifications(0), { wrapper });
    await waitFor(() => expect(result.current.items).toHaveLength(1));

    await act(async () => { await result.current.markAllRead(); });

    expect(result.current.unreadCount).toBe(0);
    expect(apiClient.patch).toHaveBeenCalledWith('/acme/notifications/read-all');
  });
});
