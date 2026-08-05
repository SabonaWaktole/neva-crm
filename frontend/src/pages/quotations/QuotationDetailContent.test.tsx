import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, waitFor, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { QuotationDetailContent } from './QuotationDetailContent';
import { useQuotations, useQuotationActions } from '../../hooks/useQuotations';
import { useTeam } from '../../hooks/useTeam';

vi.mock('../../hooks/useQuotations');
vi.mock('../../hooks/useTeam');

/**
 * Guards the fix for the `exhaustive-deps` violation on this file's load effect.
 *
 * `loadData` was called by a `useEffect` but omitted from its dependency array.
 * The naive fix — adding it — would have refetched on every render, because the
 * function was recreated each time. It is now wrapped in `useCallback`, and this
 * test exists so that if anyone unwraps it, the loop shows up here rather than
 * as a production request storm.
 */
describe('QuotationDetailContent load effect', () => {
  const fetchQuotationDetail = vi.fn();

  const detail = {
    quotation: { id: 'q-abcdef12-0000', clientName: 'Acme', status: 'DRAFT', grandTotal: 100, createdAt: '2026-07-01T10:00:00Z', createdByUserId: 'u1' },
    lineItems: [],
    history: [],
    permittedActions: [],
  };

  beforeEach(() => {
    vi.clearAllMocks();
    fetchQuotationDetail.mockResolvedValue(detail);
    (useQuotations as any).mockReturnValue({ fetchQuotationDetail, loading: false });
    (useQuotationActions as any).mockReturnValue({
      submitQuotation: vi.fn(), approveQuotation: vi.fn(),
      markQuotationAccepted: vi.fn(), markQuotationRejected: vi.fn(),
      expireQuotation: vi.fn(), returnQuotationToDraft: vi.fn(),
      error: null,
    });
    (useTeam as any).mockReturnValue({ staff: [], fetchStaff: vi.fn() });
  });

  const renderAt = (id: string) =>
    render(
      <MemoryRouter initialEntries={[`/acme/quotations/${id}`]}>
        <Routes>
          <Route path="/:tenantSlug/quotations/:id" element={<QuotationDetailContent />} />
        </Routes>
      </MemoryRouter>
    );

  it('fetches exactly once for a given quotation', async () => {
    renderAt('q-abcdef12-0000');

    await waitFor(() => expect(fetchQuotationDetail).toHaveBeenCalled());
    // The assertion that matters: settling must not trigger another round.
    await waitFor(() => expect(fetchQuotationDetail).toHaveBeenCalledTimes(1));
  });

  it('does not refetch when the component re-renders with the same id', async () => {
    const { rerender } = renderAt('q-abcdef12-0000');
    await waitFor(() => expect(fetchQuotationDetail).toHaveBeenCalledTimes(1));

    rerender(
      <MemoryRouter initialEntries={['/acme/quotations/q-abcdef12-0000']}>
        <Routes>
          <Route path="/:tenantSlug/quotations/:id" element={<QuotationDetailContent />} />
        </Routes>
      </MemoryRouter>
    );

    // A re-render is not a new quotation. Without useCallback this climbs.
    await waitFor(() => expect(fetchQuotationDetail).toHaveBeenCalledTimes(1));
  });

  it('stays stable over repeated renders rather than looping', async () => {
    renderAt('q-abcdef12-0000');
    await waitFor(() => expect(fetchQuotationDetail).toHaveBeenCalledTimes(1));

    // Give any runaway effect several ticks to reveal itself.
    for (let i = 0; i < 5; i += 1) {
      await new Promise((resolve) => setTimeout(resolve, 0));
    }

    expect(fetchQuotationDetail).toHaveBeenCalledTimes(1);
  });
});

/**
 * The status-history timeline reads `toStatus`/`note` off each history row —
 * not `status`/`reason`, which the row never had. That mismatch meant every
 * entry silently rendered with no status label and no note, which is exactly
 * where a client's Re-quote comment (RespondToPublicQuotationUseCase) needs
 * to reach staff.
 */
describe('QuotationDetailContent status history', () => {
  const fetchQuotationDetail = vi.fn();

  const baseDetail = {
    quotation: {
      id: 'q-abcdef12-0000', clientName: 'Acme', status: 'REJECTED',
      grandTotal: 100, createdAt: '2026-07-01T10:00:00Z', createdByUserId: 'u1'
    },
    lineItems: [],
    permittedActions: [],
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (useQuotations as any).mockReturnValue({ fetchQuotationDetail, loading: false });
    (useQuotationActions as any).mockReturnValue({
      submitQuotation: vi.fn(), approveQuotation: vi.fn(),
      markQuotationAccepted: vi.fn(), markQuotationRejected: vi.fn(),
      expireQuotation: vi.fn(), returnQuotationToDraft: vi.fn(),
      error: null,
    });
    (useTeam as any).mockReturnValue({ staff: [], fetchStaff: vi.fn() });
  });

  const renderAt = (id: string) =>
    render(
      <MemoryRouter initialEntries={[`/acme/quotations/${id}`]}>
        <Routes>
          <Route path="/:tenantSlug/quotations/:id" element={<QuotationDetailContent />} />
        </Routes>
      </MemoryRouter>
    );

  it('shows the status a row changed TO, and attributes a client-driven Reject to the client', async () => {
    fetchQuotationDetail.mockResolvedValue({
      ...baseDetail,
      history: [
        {
          fromStatus: 'SENT', toStatus: 'REJECTED', changedByUserId: null,
          changedAt: '2026-08-01T09:00:00Z', note: 'Please add a bulk discount'
        },
      ],
    });

    renderAt('q-abcdef12-0000');

    // "Rejected" appears twice — the status badge and the timeline entry —
    // so scope to the timeline row itself rather than the bare text.
    await screen.findByText(/By The client/i);
    expect(screen.getAllByText('Rejected').length).toBeGreaterThanOrEqual(2);
    expect(screen.getByText(/Please add a bulk discount/)).toBeInTheDocument();
  });

  it('still attributes to Unknown user when a NULL actor is not a client-eligible transition', async () => {
    fetchQuotationDetail.mockResolvedValue({
      ...baseDetail,
      quotation: { ...baseDetail.quotation, status: 'EXPIRED' },
      history: [
        {
          fromStatus: 'SENT', toStatus: 'EXPIRED', changedByUserId: null,
          changedAt: '2026-08-01T09:00:00Z', note: null
        },
      ],
    });

    renderAt('q-abcdef12-0000');

    await screen.findByText(/By Unknown user/i);
    expect(screen.getAllByText('Expired').length).toBeGreaterThanOrEqual(2);
  });
});
