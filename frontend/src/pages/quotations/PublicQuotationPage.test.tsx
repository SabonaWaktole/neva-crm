import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { PublicQuotationPage } from './PublicQuotationPage';

const quotation = {
  reference: 'ABC12345',
  status: 'SENT',
  issuedAt: '2026-07-01T00:00:00.000Z',
  sentAt: '2026-07-02T00:00:00.000Z',
  clientName: 'Acme Ltd',
  company: {
    name: 'Wiztik',
    logoUrl: null,
    address: '1 High Street, Tirana',
    contactEmail: 'hello@wiztik.eu',
    contactPhone: null,
  },
  currency: 'EUR',
  locale: 'en-GB',
  lines: [
    { description: 'Widget', quantity: 2, unitPrice: 10, lineTotal: 20 },
    { description: 'Gadget', quantity: 1, unitPrice: 5.5, lineTotal: 5.5 },
  ],
  subtotal: 25.5,
};

const renderPage = () =>
  render(
    <MemoryRouter initialEntries={['/q/token-123']}>
      <Routes>
        <Route path="/q/:token" element={<PublicQuotationPage />} />
      </Routes>
    </MemoryRouter>
  );

describe('PublicQuotationPage', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  const respondWith = (ok: boolean, body: unknown = {}) => {
    (globalThis.fetch as any).mockResolvedValue({
      ok,
      json: async () => body,
    });
  };

  it('renders the quotation for a valid token', async () => {
    respondWith(true, quotation);
    renderPage();

    expect(await screen.findByText('Wiztik')).toBeInTheDocument();
    expect(screen.getByText('ABC12345')).toBeInTheDocument();
    expect(screen.getByText('Acme Ltd')).toBeInTheDocument();
    expect(screen.getByText('Widget')).toBeInTheDocument();
  });

  it('formats money in the issuing workspace currency, not the viewer locale', async () => {
    // The customer's browser may be en-US; a quotation priced in EUR must not
    // render as dollars because of where the reader happens to be.
    respondWith(true, quotation);
    renderPage();

    await waitFor(() => expect(screen.getByText('Wiztik')).toBeInTheDocument());
    expect(screen.getByText('€25.50')).toBeInTheDocument();
  });

  it('shows one generic message for any unreachable quotation', async () => {
    // The API deliberately returns 404 for unknown, draft and withdrawn alike;
    // the page must not invent a distinction the server refused to make.
    respondWith(false);
    renderPage();

    expect(
      await screen.findByText('This quotation link is no longer valid.')
    ).toBeInTheDocument();
  });

  it('shows the same message when the request fails outright', async () => {
    (globalThis.fetch as any).mockRejectedValue(new Error('network down'));
    renderPage();

    expect(
      await screen.findByText('This quotation link is no longer valid.')
    ).toBeInTheDocument();
  });

  it('links the PDF at the public endpoint for this token', async () => {
    respondWith(true, quotation);
    renderPage();

    const link = await screen.findByRole('link', { name: /download pdf/i });
    expect(link).toHaveAttribute('href', expect.stringContaining('/public/quotations/token-123/pdf'));
  });

  it('fetches without credentials, so a viewer is never logged out by opening it', async () => {
    respondWith(true, quotation);
    renderPage();

    await waitFor(() => expect(globalThis.fetch).toHaveBeenCalled());
    const [, init] = (globalThis.fetch as any).mock.calls[0];
    // Plain fetch with no options at all: no cookies, no interceptors.
    expect(init).toBeUndefined();
  });

  describe('responding to a Sent quotation', () => {
    const respondSequence = (...bodies: unknown[]) => {
      const mock = globalThis.fetch as any;
      bodies.forEach((body) => {
        mock.mockResolvedValueOnce({ ok: true, status: 200, json: async () => body });
      });
    };

    it('accepts after a confirmation step, and shows the updated state', async () => {
      const user = userEvent.setup();
      respondWith(true, quotation);
      renderPage();
      await screen.findByText('Wiztik');

      await user.click(screen.getByRole('button', { name: 'Accept' }));
      expect(screen.getByText(/accept this quotation/i)).toBeInTheDocument();

      respondSequence({ ...quotation, status: 'ACCEPTED' });
      await user.click(screen.getByRole('button', { name: 'Confirm' }));

      expect(await screen.findByText(/accepted this quotation/i)).toBeInTheDocument();
      const [url, init] = (globalThis.fetch as any).mock.calls.at(-1);
      expect(url).toContain('/public/quotations/token-123/accept');
      expect(init.method).toBe('POST');
    });

    it('rejects after a confirmation step', async () => {
      const user = userEvent.setup();
      respondWith(true, quotation);
      renderPage();
      await screen.findByText('Wiztik');

      await user.click(screen.getByRole('button', { name: 'Reject' }));
      respondSequence({ ...quotation, status: 'REJECTED' });
      await user.click(screen.getByRole('button', { name: 'Confirm' }));

      expect(await screen.findByText(/declined this quotation/i)).toBeInTheDocument();
      const [url] = (globalThis.fetch as any).mock.calls.at(-1);
      expect(url).toContain('/public/quotations/token-123/reject');
    });

    it('requires a note before Re-quote can be sent, and sends it to the reject route', async () => {
      const user = userEvent.setup();
      respondWith(true, quotation);
      renderPage();
      await screen.findByText('Wiztik');

      await user.click(screen.getByRole('button', { name: 'Request changes' }));
      const sendButton = screen.getByRole('button', { name: 'Send' });
      expect(sendButton).toBeDisabled();

      await user.type(screen.getByPlaceholderText(/quantity discount/i), 'Please add a bulk discount');
      expect(sendButton).toBeEnabled();

      respondSequence({ ...quotation, status: 'REJECTED' });
      await user.click(sendButton);

      const [url, init] = (globalThis.fetch as any).mock.calls.at(-1);
      expect(url).toContain('/public/quotations/token-123/reject');
      expect(JSON.parse(init.body)).toEqual({ note: 'Please add a bulk discount' });
      expect(await screen.findByText(/declined this quotation/i)).toBeInTheDocument();
    });

    it('hides the action buttons once the quotation is no longer Sent', async () => {
      respondWith(true, { ...quotation, status: 'ACCEPTED' });
      renderPage();

      await screen.findByText('Wiztik');
      expect(screen.queryByRole('button', { name: 'Accept' })).not.toBeInTheDocument();
      expect(screen.getByText(/accepted this quotation/i)).toBeInTheDocument();
    });

    it('shows the server error and stays on Sent when Accept is refused (e.g. out of stock), instead of silently reverting', async () => {
      // Regression: a non-2xx, non-404 response used to be parsed as if it
      // were the quotation body, so this looked like a no-op — the confirm
      // step just closed and the same three buttons reappeared with nothing
      // to explain why.
      const user = userEvent.setup();
      respondWith(true, quotation);
      renderPage();
      await screen.findByText('Wiztik');

      await user.click(screen.getByRole('button', { name: 'Accept' }));

      (globalThis.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 422,
        json: async () => ({ error: 'One or more items are no longer available in the quoted quantity.' }),
      });
      await user.click(screen.getByRole('button', { name: 'Confirm' }));

      expect(
        await screen.findByText('One or more items are no longer available in the quoted quantity.')
      ).toBeInTheDocument();
      // Still Sent, still mid-confirmation — not silently reset.
      expect(screen.getByRole('button', { name: 'Confirm' })).toBeInTheDocument();
    });
  });
});
