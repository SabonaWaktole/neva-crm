import { GetInventoryReportUseCase } from '../../../../src/reports/application/use-cases/GetInventoryReportUseCase';
import { IReportRepository } from '../../../../src/reports/domain/IReportRepository';

describe('GetInventoryReportUseCase', () => {
  it('should return inventory value by warehouse', async () => {
    const mockRepo: IReportRepository = {
      getMonthlyRevenue: jest.fn(),
      getClientStatusDistribution: jest.fn(),
      getInventoryValueByWarehouse: jest.fn().mockResolvedValue([
        { warehouseName: 'Main WH', totalItems: 100, totalValue: 5000 },
        { warehouseName: 'Store 1', totalItems: 50, totalValue: 2500 }
      ])
    };

    const useCase = new GetInventoryReportUseCase(mockRepo);
    const result = await useCase.execute('tenant-1');

    expect(result).toHaveLength(2);
    expect(result[0].totalValue).toBe(5000);
    expect(mockRepo.getInventoryValueByWarehouse).toHaveBeenCalledWith('tenant-1');
  });

  it('should throw if tenantId is missing', async () => {
    const mockRepo: IReportRepository = {
      getMonthlyRevenue: jest.fn(),
      getClientStatusDistribution: jest.fn(),
      getInventoryValueByWarehouse: jest.fn()
    };

    const useCase = new GetInventoryReportUseCase(mockRepo);
    await expect(useCase.execute('')).rejects.toThrow('Tenant ID is required');
  });
});
