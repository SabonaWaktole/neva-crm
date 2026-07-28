import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
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
});
