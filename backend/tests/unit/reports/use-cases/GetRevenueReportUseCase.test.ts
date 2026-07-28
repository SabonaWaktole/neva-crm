import { GetRevenueReportUseCase } from '../../../../src/reports/application/use-cases/GetRevenueReportUseCase';
import { IReportRepository } from '../../../../src/reports/domain/IReportRepository';

describe('GetRevenueReportUseCase', () => {
  it('should return monthly revenue from the repository', async () => {
    const mockRepo: IReportRepository = {
      getMonthlyRevenue: jest.fn().mockResolvedValue([
        { month: '2026-06', revenue: 5000 },
        { month: '2026-07', revenue: 7500 }
      ]),
      getClientStatusDistribution: jest.fn(),
      getInventoryValueByWarehouse: jest.fn(),
      getNewClientsTrend: jest.fn(),
      getAppointmentStatusDistribution: jest.fn(),
      getAppointmentsByStaff: jest.fn(),
      getLowStockItems: jest.fn()
    };

    const useCase = new GetRevenueReportUseCase(mockRepo);
    const result = await useCase.execute('tenant-1', 12);

    expect(result).toHaveLength(2);
    expect(result[1].revenue).toBe(7500);
    expect(mockRepo.getMonthlyRevenue).toHaveBeenCalledWith('tenant-1', 12);
  });

  it('should throw if tenantId is missing', async () => {
    const mockRepo: IReportRepository = {
      getMonthlyRevenue: jest.fn(),
      getClientStatusDistribution: jest.fn(),
      getInventoryValueByWarehouse: jest.fn(),
      getNewClientsTrend: jest.fn(),
      getAppointmentStatusDistribution: jest.fn(),
      getAppointmentsByStaff: jest.fn(),
      getLowStockItems: jest.fn()
    };

    const useCase = new GetRevenueReportUseCase(mockRepo);
    await expect(useCase.execute('', 12)).rejects.toThrow('Tenant ID is required');
  });

  it('should throw if limitMonths is invalid', async () => {
    const mockRepo: IReportRepository = {
      getMonthlyRevenue: jest.fn(),
      getClientStatusDistribution: jest.fn(),
      getInventoryValueByWarehouse: jest.fn(),
      getNewClientsTrend: jest.fn(),
      getAppointmentStatusDistribution: jest.fn(),
      getAppointmentsByStaff: jest.fn(),
      getLowStockItems: jest.fn()
    };

    const useCase = new GetRevenueReportUseCase(mockRepo);
    await expect(useCase.execute('tenant-1', 0)).rejects.toThrow('Limit months must be between 1 and 60');
    await expect(useCase.execute('tenant-1', 61)).rejects.toThrow('Limit months must be between 1 and 60');
  });
});
