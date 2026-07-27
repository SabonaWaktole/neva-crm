import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TenantManagementTable } from './TenantManagementTable';
import type { Tenant } from '../../../services/dashboardService';

/**
 * The Status column and the actions menu.
 *
 * Status was removed under TD-020 because the model tracked nothing to put in
 * it, and the actions button was inert because there were no actions. Both now
 * exist, so what these tests protect is that the column says what is true and
 * the menu offers the action that applies — a menu offering "Suspend" on an
 * already-suspended workspace is the kind of wrong that looks fine in a
 * screenshot.
 */
describe('TenantManagementTable', () => {
  const tenant = (overrides: Partial<Tenant> = {}): Tenant => ({
    id: 't-1',
    name: 'Acme Corp',
    urlSlug: 'acme',
    subscriptionStatus: 'ACTIVE',
    createdAt: '2026-01-15T00:00:00.000Z',
    ...overrides,
  });

  const handlers = () => ({ onSuspend: vi.fn(), onReactivate: vi.fn() });

  describe('status column', () => {
    it('shows Active for an active workspace', () => {
      render(<TenantManagementTable tenants={[tenant()]} {...handlers()} />);
      expect(screen.getByText('Active')).toBeTruthy();
    });

    it('shows Suspended for a suspended workspace', () => {
      render(
        <TenantManagementTable
          tenants={[tenant({ subscriptionStatus: 'SUSPENDED' })]}
          {...handlers()}
        />
      );
      expect(screen.getByText('Suspended')).toBeTruthy();
    });

    it('reflects each row independently', () => {
      render(
        <TenantManagementTable
          tenants={[
            tenant({ id: 't-1', name: 'Active Co' }),
            tenant({ id: 't-2', name: 'Suspended Co', subscriptionStatus: 'SUSPENDED' }),
          ]}
          {...handlers()}
        />
      );

      expect(screen.getByText('Active')).toBeTruthy();
      expect(screen.getByText('Suspended')).toBeTruthy();
    });
  });

  describe('actions menu', () => {
    it('offers Suspend for an active workspace, and not Reactivate', async () => {
      const h = handlers();
      render(<TenantManagementTable tenants={[tenant()]} {...h} />);

      await userEvent.click(screen.getByRole('button', { name: /Actions for Acme Corp/i }));

      expect(screen.getByText('Suspend workspace')).toBeTruthy();
      expect(screen.queryByText('Reactivate workspace')).toBeNull();
    });

    it('offers Reactivate for a suspended workspace, and not Suspend', async () => {
      const h = handlers();
      render(
        <TenantManagementTable
          tenants={[tenant({ subscriptionStatus: 'SUSPENDED' })]}
          {...h}
        />
      );

      await userEvent.click(screen.getByRole('button', { name: /Actions for Acme Corp/i }));

      expect(screen.getByText('Reactivate workspace')).toBeTruthy();
      expect(screen.queryByText('Suspend workspace')).toBeNull();
    });

    it('hands the tenant to the handler rather than just firing', async () => {
      const h = handlers();
      render(<TenantManagementTable tenants={[tenant()]} {...h} />);

      await userEvent.click(screen.getByRole('button', { name: /Actions for Acme Corp/i }));
      await userEvent.click(screen.getByText('Suspend workspace'));

      expect(h.onSuspend).toHaveBeenCalledWith(expect.objectContaining({ id: 't-1' }));
      expect(h.onReactivate).not.toHaveBeenCalled();
    });

    it('renders no actions menu at all when no handlers are given', () => {
      // The dashboard embeds this table read-only. A disabled button promising
      // options that are not coming on that screen is worse than no button.
      render(<TenantManagementTable tenants={[tenant()]} />);
      expect(screen.queryByRole('button', { name: /Actions for/i })).toBeNull();
    });

    it('disables only the row whose action is in flight', () => {
      const h = handlers();
      render(
        <TenantManagementTable
          tenants={[tenant({ id: 't-1', name: 'Busy Co' }), tenant({ id: 't-2', name: 'Idle Co' })]}
          pendingTenantId="t-1"
          {...h}
        />
      );

      expect(
        screen.getByRole('button', { name: /Actions for Busy Co/i }).hasAttribute('disabled')
      ).toBe(true);
      expect(
        screen.getByRole('button', { name: /Actions for Idle Co/i }).hasAttribute('disabled')
      ).toBe(false);
    });
  });

  it('does not reinstate a Plan column — billing is still unmodelled', () => {
    // The other half of TD-020. Status came back because the field it reads now
    // exists; Plan has no such field, so it would be the same permanently empty
    // column it was before.
    render(<TenantManagementTable tenants={[tenant()]} {...handlers()} />);
    expect(screen.queryByText('Plan')).toBeNull();
  });
});
