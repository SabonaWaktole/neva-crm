
import { render, screen } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { ClientDetailContent } from './ClientDetailContent';
import * as clientsHooks from '../../hooks/useClients';
import * as apptHooks from '../../hooks/useAppointments';

// Mock dependencies
vi.mock('react-router-dom', () => ({
  useParams: () => ({ clientId: 'client-1' }),
  useNavigate: () => vi.fn(),
}));

vi.mock('../../hooks/useClients', () => ({
  useClientDetail: vi.fn(),
  useClientHistory: vi.fn(),
  useClientSettings: vi.fn(),
  useAddInteraction: vi.fn()
}));

vi.mock('../../hooks/useAppointments', () => ({
  useClientAppointments: vi.fn()
}));

// Mock heavy child components
vi.mock('../../components/ui/SlideOver', () => ({
  SlideOver: () => <div data-testid="slide-over" />
}));
vi.mock('../../components/panels/AppointmentDetailPanel/AppointmentDetailPanel', () => ({
  AppointmentDetailPanel: () => <div data-testid="appointment-panel" />
}));
vi.mock('../../components/forms/AppointmentForm/AppointmentForm', () => ({
  AppointmentForm: () => <div data-testid="appointment-form" />
}));

describe('ClientDetailContent Timeline', () => {
  beforeEach(() => {
    vi.mocked(clientsHooks.useClientSettings).mockReturnValue({
      customFields: [],
      outcomeCategories: [],
      isLoading: false,
      error: null,
      fetchSettings: vi.fn() as any
    });
    
    vi.mocked(clientsHooks.useAddInteraction).mockReturnValue({
      addInteraction: vi.fn(),
      isLoading: false,
      error: null
    });
    
    vi.mocked(apptHooks.useClientAppointments).mockReturnValue({
      appointments: [],
      total: 0,
      isLoading: false,
      error: null,
      updateAppointmentLocally: vi.fn(),
      fetchClientAppointments: vi.fn() as any
    });
  });

  it('renders APPOINTMENT_COMPLETED with the correct mapped status from activityMapper', () => {
    const mockClient = { id: 'client-1', name: 'Test Client', status: 'ACTIVE', contactInfo: {} };
    
    vi.mocked(clientsHooks.useClientDetail).mockReturnValue({
      client: mockClient,
      isLoading: false,
      fetchClient: vi.fn()
    } as any);
    
    vi.mocked(clientsHooks.useClientHistory).mockReturnValue({
      history: {
        timeline: [
          {
            id: 't-1',
            type: 'APPOINTMENT_COMPLETED',
            timestamp: new Date().toISOString(),
            actor: 'System',
            description: 'Appointment (COMPLETED)',
            details: {}
          }
        ]
      },
      isLoading: false,
      fetchHistory: vi.fn()
    } as any);

    render(<ClientDetailContent />);

    // Assert that the explicit status label from activityMapper renders, NOT the fallback empty state
    expect(screen.getByText('Completed')).toBeInTheDocument();
  });
  
  it('renders APPOINTMENT_CANCELLED with the correct mapped status from activityMapper', () => {
    const mockClient = { id: 'client-1', name: 'Test Client', status: 'ACTIVE', contactInfo: {} };
    
    vi.mocked(clientsHooks.useClientDetail).mockReturnValue({
      client: mockClient,
      isLoading: false,
      fetchClient: vi.fn()
    } as any);
    
    vi.mocked(clientsHooks.useClientHistory).mockReturnValue({
      history: {
        timeline: [
          {
            id: 't-2',
            type: 'APPOINTMENT_CANCELLED',
            timestamp: new Date().toISOString(),
            actor: 'System',
            description: 'Appointment (CANCELLED)',
            details: {}
          }
        ]
      },
      isLoading: false,
      fetchHistory: vi.fn()
    } as any);

    render(<ClientDetailContent />);

    // Assert that the explicit status label renders
    expect(screen.getByText('Cancelled')).toBeInTheDocument();
  });
});
