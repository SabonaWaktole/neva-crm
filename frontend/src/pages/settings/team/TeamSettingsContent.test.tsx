import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
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

  beforeEach(() => {
    vi.clearAllMocks();

    (useAuthStore as any).mockReturnValue({
      user: { role: 'BUSINESS_OWNER' }
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

  it('renders active members and pending invitations headers', () => {
    render(<TeamSettingsContent />);
    
    expect(screen.getByText('Team Members')).toBeDefined();
    expect(screen.getByText('Active Members')).toBeDefined();
    expect(screen.getByText('Pending Invitations')).toBeDefined();
    expect(mockFetchStaff).toHaveBeenCalledTimes(1);
    expect(mockFetchPendingInvitations).toHaveBeenCalledTimes(1);
  });

  it('hides Invite Member button and Pending Invitations for STAFF role', () => {
    (useAuthStore as any).mockReturnValue({
      user: { role: 'STAFF' }
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
});
