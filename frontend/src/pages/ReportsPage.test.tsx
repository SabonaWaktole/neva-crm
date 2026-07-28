import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ReportsPage } from './ReportsPage';
import { useReports } from '../hooks/useReports';
import { useAuthStore } from '../store/useAuthStore';

vi.mock('../hooks/useReports');

/**
 * Recharts renders nothing under jsdom — ResponsiveContainer measures zero and
 * skips its children — so the chart internals are stubbed just enough to invoke
 * the two things under test: the tooltip's `format` callback and the Y axis's
 * `tickFormatter`. Those are precisely the two places that were hard-coded to
 * dollars, and the second one (compactCurrency) was a literal '$' rather than a
 * formatter, so a currency setting alone would never have fixed it.
 */
vi.mock('recharts', async () => {
  const { cloneElement } = await import('react');
  const Passthrough = ({ children }: any) => <div>{children}</div>;
  return {
    ResponsiveContainer: Passthrough,
    LineChart: Passthrough,
    BarChart: Passthrough,
    PieChart: Passthrough,
    Pie: Passthrough,
    Cell: () => null,
    Line: () => null,
    Bar: () => null,
    Legend: () => null,
    CartesianGrid: () => null,
    XAxis: () => null,
    // Only the money axes pass a tickFormatter; the unit-count axis has none
    // and is deliberately not treated as a money site.
    YAxis: ({ tickFormatter }: any) =>
      tickFormatter ? <div data-testid="axis-tick">{tickFormatter(1_200_000)}</div> : null,
    // Recharts calls `content` with the hover state; reproduce that so the
    // tooltip's format callback actually runs.
    Tooltip: ({ content }: any) => (
      <div data-testid="tooltip">
        {content
          ? cloneElement(content, { active: true, payload: [{ name: 'Revenue', value: 1234.56 }] })
          : null}
      </div>
    ),
  };
});

const setTenant = (currency: string | null, locale: string | null) => {
  useAuthStore.setState({
    user: {
      userId: 'u1',
      email: 'owner@example.com',
      role: 'BUSINESS_OWNER',
      tenantId: 't1',
      tenantSlug: 'acme',
      tenantCurrency: currency,
      tenantLocale: locale,
    },
    isAuthenticated: true,
  });
};

const renderPage = () =>
  render(
    <MemoryRouter>
      <ReportsPage />
    </MemoryRouter>
  );

describe('ReportsPage currency', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (useReports as any).mockReturnValue({
      revenue: [{ month: '2026-01', revenue: 1234.56 }],
      clients: [],
      inventory: [{ warehouseName: 'Main', totalValue: 1_200_000, totalItems: 40 }],
      // These panels are not what this suite is about — it asserts currency
      // formatting on the money axes — but the page reads them unconditionally,
      // so the double has to supply the same shape the hook does.
      clientTrend: [],
      appointments: { byStatus: [], byStaff: [], total: 0 },
      lowStock: { items: [], outOfStockCount: 0, lowStockCount: 0 },
      loading: false,
      error: null,
      refresh: vi.fn(),
    });
  });

  it("renders axis ticks in the tenant's configured currency, not a hard-coded dollar", () => {
    setTenant('GBP', 'en-GB');
    renderPage();

    const ticks = screen.getAllByTestId('axis-tick');
    expect(ticks.length).toBeGreaterThan(0);

    // This is the assertion the old `compactCurrency` could never have passed:
    // its '$' was concatenated, not produced by a formatter.
    for (const tick of ticks) {
      expect(tick.textContent).toContain('£');
      expect(tick.textContent).not.toContain('$');
    }
  });

  it('falls back to USD when the session has no tenant currency', () => {
    setTenant(null, null);
    renderPage();

    for (const tick of screen.getAllByTestId('axis-tick')) {
      expect(tick.textContent).toContain('$');
    }
  });

  it('switches every money axis together when the currency changes', () => {
    setTenant('EUR', 'en-GB');
    renderPage();

    // Both the revenue chart and the inventory-value chart read from the same
    // formatter, so there is no way for one to drift back to dollars.
    const ticks = screen.getAllByTestId('axis-tick');
    expect(ticks.length).toBe(2);
    for (const tick of ticks) {
      expect(tick.textContent).toContain('€');
    }
  });

  it('formats tooltip amounts in the tenant currency too', () => {
    // The audit named only the tooltip formatter. Covering it as well as the
    // axis proves both halves moved, not just the one that was reported.
    setTenant('GBP', 'en-GB');
    renderPage();

    const tooltips = screen.getAllByTestId('tooltip');
    const text = tooltips.map((t) => t.textContent ?? '').join(' ');
    expect(text).toContain('£');
    expect(text).not.toContain('$');
  });
});
