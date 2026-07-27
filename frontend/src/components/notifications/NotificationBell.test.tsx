import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { NotificationBell } from './NotificationBell';
import { useNotifications } from '../../hooks/useNotifications';
import { useTeam } from '../../hooks/useTeam';

vi.mock('../../hooks/useNotifications');
vi.mock('../../hooks/useTeam');

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

/**
 * The bell's job is to render STORED notifications into CURRENT text: an i18n
 * key plus snapshot params, with the actor resolved live from the staff list.
 * These tests pin that split, because getting it wrong is invisible until
 * someone changes their name or switches language.
 */
describe('NotificationBell', () => {
  const markRead = vi.fn();
  const markAllRead = vi.fn();

  const staff = [
    { id: 'u1', email: 'ada@test', firstName: 'Ada', lastName: 'Lovelace' },
    { id: 'u2', email: 'grace@test', firstName: 'Grace', lastName: 'Hopper' },
  ];

  const notification = (over = {}) => ({
    id: 'n1',
    type: 'CLIENT_ASSIGNED',
    params: { client: 'Acme Corp' },
    actorUserId: 'u1',
    entityType: 'CLIENT' as const,
    entityId: 'client-9',
    readAt: null,
    createdAt: '2026-07-27T10:00:00.000Z',
    ...over,
  });

  const setup = (items: any[] = [], unreadCount = 0) => {
    (useNotifications as any).mockReturnValue({
      items, unreadCount, isLoading: false, fetchNotifications: vi.fn(), markRead, markAllRead,
    });
    (useTeam as any).mockReturnValue({ staff, fetchStaff: vi.fn() });

    return render(
      <MemoryRouter initialEntries={['/acme/dashboard']}>
        <Routes>
          <Route path="/:tenantSlug/dashboard" element={<NotificationBell />} />
        </Routes>
      </MemoryRouter>
    );
  };

  beforeEach(() => vi.clearAllMocks());

  it('shows no badge when everything is read', () => {
    setup([notification({ readAt: '2026-07-27T11:00:00.000Z' })], 0);

    expect(screen.getByRole('button', { name: /notifications/i })).toBeDefined();
    expect(screen.queryByText('1')).toBeNull();
  });

  it('shows the unread count and announces it in the accessible name', () => {
    setup([notification()], 3);

    expect(screen.getByText('3')).toBeDefined();
    expect(screen.getByRole('button', { name: /3 unread/i })).toBeDefined();
  });

  it('caps a very large count rather than stretching the badge', () => {
    setup([notification()], 250);

    expect(screen.getByText('99+')).toBeDefined();
  });

  it('renders the stored key with its params and the LIVE actor name', async () => {
    setup([notification()], 1);

    await userEvent.click(screen.getByRole('button', { name: /notifications/i }));

    // "Ada Lovelace" comes from the staff list, not from the stored row;
    // "Acme Corp" comes from the stored snapshot.
    expect(screen.getByText('Ada Lovelace assigned Acme Corp to you')).toBeDefined();
  });

  it('falls back gracefully when the actor is no longer in the staff list', async () => {
    setup([notification({ actorUserId: 'departed' })], 1);

    await userEvent.click(screen.getByRole('button', { name: /notifications/i }));

    // Never a raw UUID where a name belongs — TD-021's rule.
    expect(screen.queryByText(/departed/)).toBeNull();
    expect(screen.getByText(/assigned Acme Corp to you/)).toBeDefined();
  });

  it('marks a notification read and navigates to its target when clicked', async () => {
    setup([notification()], 1);

    await userEvent.click(screen.getByRole('button', { name: /notifications/i }));
    await userEvent.click(screen.getByText('Ada Lovelace assigned Acme Corp to you'));

    expect(markRead).toHaveBeenCalledWith('n1');
    expect(mockNavigate).toHaveBeenCalledWith('/acme/clients/client-9');
  });

  it('does not re-mark an already-read notification', async () => {
    setup([notification({ readAt: '2026-07-27T11:00:00.000Z' })], 0);

    await userEvent.click(screen.getByRole('button', { name: /notifications/i }));
    await userEvent.click(screen.getByText('Ada Lovelace assigned Acme Corp to you'));

    expect(markRead).not.toHaveBeenCalled();
  });

  it('offers mark-all only when something is unread', async () => {
    const { unmount } = setup([notification()], 1);
    await userEvent.click(screen.getByRole('button', { name: /notifications/i }));
    expect(screen.getByText('Mark all as read')).toBeDefined();
    unmount();

    setup([notification({ readAt: 'x' })], 0);
    await userEvent.click(screen.getByRole('button', { name: /notifications/i }));
    expect(screen.queryByText('Mark all as read')).toBeNull();
  });

  it('shows an empty state rather than a blank panel', async () => {
    setup([], 0);

    await userEvent.click(screen.getByRole('button', { name: /notifications/i }));

    expect(screen.getByText("You're all caught up.")).toBeDefined();
  });

  it('closes on Escape', async () => {
    setup([notification()], 1);
    await userEvent.click(screen.getByRole('button', { name: /notifications/i }));
    expect(screen.getByText('Notifications')).toBeDefined();

    await userEvent.keyboard('{Escape}');

    await waitFor(() => expect(screen.queryByRole('menu')).toBeNull());
  });

  it('renders an unknown type as its key instead of an empty row', async () => {
    setup([notification({ type: 'SOMETHING_NEW', params: {} })], 1);

    await userEvent.click(screen.getByRole('button', { name: /notifications/i }));

    // A notification that arrived is evidence of something; dropping it
    // silently would hide a missing catalogue entry.
    expect(screen.getByText('SOMETHING_NEW')).toBeDefined();
  });
});
