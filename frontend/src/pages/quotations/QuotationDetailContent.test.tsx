import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { QuotationDetailContent } from './QuotationDetailContent';
import { useQuotations, useQuotationActions } from '../../hooks/useQuotations';

vi.mock('../../hooks/useQuotations');

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
