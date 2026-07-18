import { DefineOutcomeCategoryUseCase } from '../../../../../src/clients/application/use-cases/DefineOutcomeCategoryUseCase';
import { IOutcomeCategoryRepository } from '../../../../../src/clients/domain/repositories/IOutcomeCategoryRepository';
import { UserRole } from '../../../../../src/auth/domain/enums/UserRole';

describe('DefineOutcomeCategoryUseCase', () => {
  let useCase: DefineOutcomeCategoryUseCase;
  let outcomeRepo: jest.Mocked<IOutcomeCategoryRepository>;

  beforeEach(() => {
    outcomeRepo = { findByTenantId: jest.fn(), findById: jest.fn(), save: jest.fn() };
    useCase = new DefineOutcomeCategoryUseCase(outcomeRepo);
  });

  it('allows BUSINESS_OWNER to create a category', async () => {
    const result = await useCase.execute({
      tenantId: 't1',
      requestingUserRole: UserRole.BUSINESS_OWNER,
      label: 'Closed Won',
    });

    expect(outcomeRepo.save).toHaveBeenCalledWith('t1', expect.anything());
    expect(result.label).toBe('Closed Won');
  });

  it('rejects STAFF from creating a category', async () => {
    await expect(useCase.execute({
      tenantId: 't1',
      requestingUserRole: UserRole.STAFF,
      label: 'Closed Won',
    })).rejects.toThrow('Only Business Owners can define outcome categories');
  });
});
