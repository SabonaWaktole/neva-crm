import { SearchAppointmentsUseCase } from '../../../../../src/appointments/application/use-cases/SearchAppointmentsUseCase';
import { AppointmentStatus } from '../../../../../src/appointments/domain/enums/AppointmentStatus';

describe('SearchAppointmentsUseCase', () => {
  let useCase: SearchAppointmentsUseCase;
  let mockAppointmentRepository: any;

  beforeEach(() => {
    mockAppointmentRepository = {
      findByDateRange: jest.fn(),
    };

    useCase = new SearchAppointmentsUseCase(mockAppointmentRepository);
  });

  it('should return mapped appointment DTOs for a given date range', async () => {
    const mockAppointments = [
      {
        id: 'apt-1',
        clientId: 'client-1',
        assignedUserId: 'user-1',
        scheduledAt: new Date('2026-07-20T10:00:00Z'),
        status: AppointmentStatus.SCHEDULED,
      },
      {
        id: 'apt-2',
        clientId: 'client-2',
        assignedUserId: 'user-1',
        scheduledAt: new Date('2026-07-21T11:00:00Z'),
        status: AppointmentStatus.CONFIRMED,
      },
    ];

    mockAppointmentRepository.findByDateRange.mockResolvedValue(mockAppointments);

    const tenantId = 'tenant-1';
    const startDate = new Date('2026-07-01T00:00:00Z');
    const endDate = new Date('2026-07-31T23:59:59Z');
    const filters = { clientId: 'client-1', assignedUserId: 'user-1', status: AppointmentStatus.SCHEDULED };

    const results = await useCase.execute({ tenantId, startDate, endDate, filters });

    expect(mockAppointmentRepository.findByDateRange).toHaveBeenCalledWith(tenantId, startDate, endDate, filters);
    expect(results).toEqual([
      {
        id: 'apt-1',
        clientId: 'client-1',
        assignedUserId: 'user-1',
        scheduledAt: mockAppointments[0].scheduledAt,
        status: AppointmentStatus.SCHEDULED,
      },
      {
        id: 'apt-2',
        clientId: 'client-2',
        assignedUserId: 'user-1',
        scheduledAt: mockAppointments[1].scheduledAt,
        status: AppointmentStatus.CONFIRMED,
      },
    ]);
  });

  it('cross-tenant isolation: tenantId is always forwarded to the repository', async () => {
    mockAppointmentRepository.findByDateRange.mockResolvedValue([]);

    const tenantId = 'tenant-X';
    const startDate = new Date('2026-07-01T00:00:00Z');
    const endDate = new Date('2026-07-31T23:59:59Z');

    await useCase.execute({ tenantId, startDate, endDate });

    // The repo is called with the exact tenantId — infrastructure enforces scoping
    expect(mockAppointmentRepository.findByDateRange).toHaveBeenCalledWith(
      'tenant-X', startDate, endDate, undefined
    );
  });
});
