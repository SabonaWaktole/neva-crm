// @ts-nocheck
import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { ClientListContent } from './ClientListContent';
import { MemoryRouter } from 'react-router-dom';
import * as useClientsModule from '../../hooks/useClients';

// Mock the hook
vi.mock('../../hooks/useClients', () => ({
  useClients: vi.fn(),
}));

describe('ClientListContent', () => {
  let mockFetchClients: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockFetchClients = vi.fn();
    
    // Default mock setup
    vi.mocked(useClientsModule.useClients).mockReturnValue({
      clients: [],
      total: 0,
      isLoading: false,
      error: null,
      fetchClients: mockFetchClients,
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  const renderComponent = () => {
    render(
      <MemoryRouter initialEntries={['/tenant-1/clients']}>
        <ClientListContent />
      </MemoryRouter>
    );
  };

  it('renders the empty state when no clients exist', () => {
    renderComponent();
    expect(screen.getByText('Client Directory')).toBeInTheDocument();
    expect(screen.getByText('Showing 0 of 0 entries')).toBeInTheDocument();
    // The DataTable renders a dedicated empty state with a call to action
    expect(screen.getByText('No clients yet')).toBeInTheDocument();
    expect(screen.getByText('Clients you add will appear here.')).toBeInTheDocument();
    expect(screen.queryByRole('row', { name: /Acme Corp/i })).not.toBeInTheDocument();
  });

  it('renders skeleton placeholders while loading', () => {
    vi.mocked(useClientsModule.useClients).mockReturnValue({
      clients: [],
      total: 0,
      isLoading: true,
      error: null,
      fetchClients: mockFetchClients,
    });
    renderComponent();
    // Loading shows skeleton rows rather than the empty state
    expect(screen.queryByText('No clients yet')).not.toBeInTheDocument();
    expect(screen.getByRole('table', { name: /client directory/i })).toBeInTheDocument();
  });

  it('renders the client list correctly', () => {
    vi.mocked(useClientsModule.useClients).mockReturnValue({
      clients: [
        {
          id: 'c1',
          tenantId: 'tenant-1',
          name: 'Acme Corp',
          contactInfo: { email: 'contact@acme.com' },
          status: 'ACTIVE',
          assignedUserId: 'u1',
          customFieldValues: {},
          lastUpdatedByUserId: 'u1',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ],
      total: 1,
      isLoading: false,
      error: null,
      fetchClients: mockFetchClients,
    });

    renderComponent();
    expect(screen.getByText('Acme Corp')).toBeInTheDocument();
    expect(screen.getByText('contact@acme.com')).toBeInTheDocument();
    expect(screen.getByText('Active')).toBeInTheDocument();
    expect(screen.getByText('Showing 1 of 1 entries')).toBeInTheDocument();
  });

  it('debounces the search input correctly', () => {
    vi.useFakeTimers();
    
    renderComponent();
    
    // Initial fetch from useEffect on mount (fetchClients({ name: '' }))
    expect(mockFetchClients).toHaveBeenCalledTimes(1);
    expect(mockFetchClients).toHaveBeenCalledWith({ name: '' });
    
    mockFetchClients.mockClear();

    const searchInput = screen.getByPlaceholderText('Search clients...');
    
    // Type rapidly
    fireEvent.change(searchInput, { target: { value: 'A' } });
    fireEvent.change(searchInput, { target: { value: 'Ac' } });
    fireEvent.change(searchInput, { target: { value: 'Acm' } });
    fireEvent.change(searchInput, { target: { value: 'Acme' } });

    // No fetch should have happened yet (timers haven't advanced)
    expect(mockFetchClients).not.toHaveBeenCalled();

    // Advance timers just under the 300ms threshold
    act(() => {
      vi.advanceTimersByTime(200);
    });
    expect(mockFetchClients).not.toHaveBeenCalled();

    // Advance the rest of the way
    act(() => {
      vi.advanceTimersByTime(100);
    });

    // NOW it should have fetched, and exactly once for the final value
    expect(mockFetchClients).toHaveBeenCalledTimes(1);
    expect(mockFetchClients).toHaveBeenCalledWith({ name: 'Acme' });

    vi.useRealTimers();
  });
});
// @ts-nocheck
