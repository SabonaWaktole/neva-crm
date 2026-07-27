import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { TeamSettingsContent } from './TeamSettingsContent';
import { useTeam } from '../../../hooks/useTeam';
import { useAuthStore } from '../../../store/useAuthStore';

// Mock the hooks
vi.mock('../../../hooks/useTeam');
vi.mock('../../../store/useAuthStore');

describe('TeamSettingsContent', () => {
  const mockFetchStaff = vi.fn();
  const mockFetchPendingInvitations = vi.fn();
  const mockInviteStaff = vi.fn();
  const mockFetchImpact = vi.fn().mockResolvedValue({ clients: 0, upcomingAppointments: 0 });
  const mockDeactivateStaff = vi.fn().mockResolvedValue(undefined);

  beforeEach(() => {
    vi.clearAllMocks();

    (useAuthStore as any).mockReturnValue({
      user: { role: 'BUSINESS_OWNER', email: 'test@example.com' }
    });

    (useTeam as any).mockReturnValue({
      staff: [],
      pendingInvitations: [],
      loadingStaff: false,
      loadingInvitations: false,
      fetchStaff: mockFetchStaff,
      fetchPendingInvitations: mockFetchPendingInvitations,
      inviteStaff: mockInviteStaff
    });
  });

  it('renders the members and pending invitations headers', () => {
    render(<TeamSettingsContent />);

    // The page title. The list heading below it is "All Members", not a second
    // "Team Members" — the list includes deactivated members, so calling it
    // "Active Members" was wrong, and reusing the page title read as a
    // duplicated heading. TD-030.
    expect(screen.getByText('Team Members')).toBeDefined();
    expect(screen.getByText('All Members')).toBeDefined();
    expect(screen.queryByText('Active Members')).toBeNull();
    expect(screen.getByText('Pending Invitations')).toBeDefined();
    expect(mockFetchStaff).toHaveBeenCalledTimes(1);
    expect(mockFetchPendingInvitations).toHaveBeenCalledTimes(1);
  });

  it('hides Invite Member button and Pending Invitations for STAFF role', () => {
    (useAuthStore as any).mockReturnValue({
      user: { role: 'STAFF', email: 'test@example.com' }
    });

    render(<TeamSettingsContent />);
    
    expect(screen.queryByText('Invite Member')).toBeNull();
    expect(screen.queryByText('Pending Invitations')).toBeNull();
  });

  it('opens invite modal when Invite Member is clicked', () => {
    render(<TeamSettingsContent />);
    
    const inviteBtn = screen.getByText('Invite Member');
    fireEvent.click(inviteBtn);
    
    expect(screen.getByText('Invite Team Member')).toBeDefined();
  });

  it('displays staff members from hook', () => {
    (useTeam as any).mockReturnValue({
      staff: [{ id: '1', email: 'test@example.com', role: 'STAFF', firstName: 'John', lastName: 'Doe' }],
      pendingInvitations: [],
      loadingStaff: false,
      loadingInvitations: false,
      fetchStaff: mockFetchStaff,
      fetchPendingInvitations: mockFetchPendingInvitations,
      inviteStaff: mockInviteStaff
    });

    render(<TeamSettingsContent />);
    
    expect(screen.getByText('John Doe')).toBeDefined();
    expect(screen.getByText('test@example.com')).toBeDefined();
  });

  describe('deactivation', () => {
    const STAFF = { id: 's1', email: 'staff@example.com', firstName: 'Sam', lastName: 'Rep', role: 'STAFF' };

    const renderWithStaff = (members, role = 'BUSINESS_OWNER', userId = 'owner-1') => {
      (useAuthStore as any).mockReturnValue({ user: { role, userId, email: 'o@e.com' } });
      (useTeam as any).mockReturnValue({
        staff: members,
        pendingInvitations: [],
        loadingStaff: false,
        loadingInvitations: false,
        fetchStaff: mockFetchStaff,
        fetchPendingInvitations: mockFetchPendingInvitations,
        inviteStaff: mockInviteStaff,
        updateStaffRole: vi.fn(),
        cancelInvitation: vi.fn(),
        fetchDeactivationImpact: mockFetchImpact,
        deactivateStaff: mockDeactivateStaff
      });
      render(<TeamSettingsContent />);
    };

    it('offers a deactivate action for staff members', () => {
      renderWithStaff([STAFF]);
      expect(screen.getByLabelText('Deactivate staff@example.com')).toBeDefined();
    });

    it('does not offer it for a BUSINESS_OWNER', () => {
      renderWithStaff([{ ...STAFF, role: 'BUSINESS_OWNER' }]);
      expect(screen.queryByLabelText('Deactivate staff@example.com')).toBeNull();
    });

    it('does not offer it for yourself', () => {
      renderWithStaff([STAFF], 'BUSINESS_OWNER', 's1');
      expect(screen.queryByLabelText('Deactivate staff@example.com')).toBeNull();
    });

    it('hides it entirely from STAFF users', () => {
      renderWithStaff([STAFF], 'STAFF');
      expect(screen.queryByLabelText('Deactivate staff@example.com')).toBeNull();
    });

    it('requires confirmation and does not deactivate on click alone', async () => {
      renderWithStaff([STAFF]);
      fireEvent.click(screen.getByLabelText('Deactivate staff@example.com'));

      expect(await screen.findByText('Deactivate team member?')).toBeDefined();
      expect(mockDeactivateStaff).not.toHaveBeenCalled();
    });

    it('states the residual-access limit rather than implying instant lockout', async () => {
      renderWithStaff([STAFF]);
      fireEvent.click(screen.getByLabelText('Deactivate staff@example.com'));
      await screen.findByText('Deactivate team member?');

      expect(screen.getByText(/within an hour at the latest/i)).toBeDefined();
    });

    it('says the account is kept, not deleted', async () => {
      renderWithStaff([STAFF]);
      fireEvent.click(screen.getByLabelText('Deactivate staff@example.com'));
      await screen.findByText('Deactivate team member?');

      expect(screen.getByText(/kept, not deleted/i)).toBeDefined();
    });

    it('surfaces outstanding assignments in the dialog', async () => {
      mockFetchImpact.mockResolvedValueOnce({ clients: 3, upcomingAppointments: 2 });
      renderWithStaff([STAFF]);
      fireEvent.click(screen.getByLabelText('Deactivate staff@example.com'));

      expect(await screen.findByText(/3 clients/i)).toBeDefined();
      expect(screen.getByText(/2 upcoming appointments/i)).toBeDefined();
      expect(screen.getByText(/until you reassign them/i)).toBeDefined();
    });

    it('deactivates once confirmed', async () => {
      renderWithStaff([STAFF]);
      fireEvent.click(screen.getByLabelText('Deactivate staff@example.com'));
      await screen.findByText('Deactivate team member?');

      fireEvent.click(screen.getByRole('button', { name: 'Deactivate' }));

      await waitFor(() => expect(mockDeactivateStaff).toHaveBeenCalledWith('s1'));
    });
  });
});
