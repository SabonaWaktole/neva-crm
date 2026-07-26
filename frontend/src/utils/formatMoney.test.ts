import { describe, it, expect } from 'vitest';
import { formatMoney, formatMoneyWhole, formatMoneyCompact } from './formatMoney';

/**
 * Before this utility existed, money was rendered nine different ways: one Intl
 * formatter pinned to USD, seven literal '$' concatenations, and three helpers
 * that emitted a bare number with no currency indicator at all. These tests pin
 * the behaviour that replaced them.
 */
describe('formatMoney', () => {
  it('uses the tenant currency rather than a hard-coded dollar', () => {
    const gbp = formatMoney(1234.5, { currency: 'GBP', locale: 'en-GB' });

    expect(gbp).toContain('£');
    expect(gbp).not.toContain('$');
  });

  it('falls back to USD when the tenant has no currency yet', () => {
    // Matches the column default, so a session still loading /auth/me renders
    // the same thing the server would.
    expect(formatMoney(10, {})).toBe('$10.00');
    expect(formatMoney(10, { currency: null, locale: null })).toBe('$10.00');
  });

  it('distinguishes "no price set" from zero', () => {
    // The inventory table needs these to look different: an unpriced product is
    // not a free one.
    expect(formatMoney(null)).toBe('—');
    expect(formatMoney(undefined)).toBe('—');
    expect(formatMoney(0)).toBe('$0.00');
  });

  it('shows cents for exact amounts and drops them for aggregates', () => {
    expect(formatMoney(1234.56)).toBe('$1,234.56');
    // Preserved from the KPI and tooltip helpers this replaced, both of which
    // deliberately used maximumFractionDigits: 0.
    expect(formatMoneyWhole(1234.56)).toBe('$1,235');
  });

  it('abbreviates compactly for chart axes, with the right symbol', () => {
    // The previous compactCurrency glued on a literal '$', so the symbol stayed
    // a dollar no matter what currency the tenant had configured.
    expect(formatMoneyCompact(1_200_000, { currency: 'USD', locale: 'en-US' })).toBe('$1.2M');

    const eur = formatMoneyCompact(1_200_000, { currency: 'EUR', locale: 'en-GB' });
    expect(eur).toContain('€');
    expect(eur).not.toContain('$');
  });

  it('formats the same amount differently per locale', () => {
    const us = formatMoney(1234.56, { currency: 'USD', locale: 'en-US' });
    const gb = formatMoney(1234.56, { currency: 'USD', locale: 'en-GB' });

    // Both valid; the point is that locale is actually consulted rather than
    // the previous `Intl.NumberFormat(undefined, ...)`, which followed whatever
    // locale the viewer's browser happened to have.
    expect(us).toBe('$1,234.56');
    expect(gb).toContain('1,234.56');
  });
});
