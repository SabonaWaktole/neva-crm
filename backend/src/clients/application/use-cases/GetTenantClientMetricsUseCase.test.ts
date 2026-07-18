import { GetTenantClientMetricsUseCase } from './GetTenantClientMetricsUseCase';
import { IClientRepository } from '../../domain/repositories/IClientRepository';

describe('GetTenantClientMetricsUseCase', () => {
  let useCase: GetTenantClientMetricsUseCase;
  let mockClientRepo: jest.Mocked<IClientRepository>;

  beforeEach(() => {
    mockClientRepo = {
      findById: jest.fn(),
      search: jest.fn(),
      countByTenant: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
    } as any;

    useCase = new GetTenantClientMetricsUseCase(mockClientRepo);
  });

  it('should return total clients and last week clients count', async () => {
    mockClientRepo.countByTenant
      .mockResolvedValueOnce(1248) // current total
      .mockResolvedValueOnce(1100); // last week total

    const result = await useCase.execute({ tenantId: 'tenant-1' });

    expect(result.totalClients).toBe(1248);
    expect(result.totalClientsLastWeek).toBe(1100);

    expect(mockClientRepo.countByTenant).toHaveBeenCalledTimes(2);
    expect(mockClientRepo.countByTenant).toHaveBeenNthCalledWith(1, 'tenant-1');
    expect(mockClientRepo.countByTenant).toHaveBeenNthCalledWith(2, 'tenant-1', expect.any(Date));

    // Verify date is ~7 days ago
    const lastWeekArg = mockClientRepo.countByTenant.mock.calls[1][1] as Date;
    const now = new Date();
    const diffDays = Math.round((now.getTime() - lastWeekArg.getTime()) / (1000 * 60 * 60 * 24));
    expect(diffDays).toBe(7);
  });
});
