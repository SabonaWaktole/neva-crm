import { UpdatePlatformSettingsUseCase } from './UpdatePlatformSettingsUseCase';
import { IPlatformSettingsRepository } from '../../domain/IPlatformSettingsRepository';
import { PlatformSettings } from '../../domain/PlatformSettings';
import { UserRole } from '../../../auth/domain/enums/UserRole';
import { UnauthorizedError } from '../../../auth/domain/errors';

describe('UpdatePlatformSettingsUseCase', () => {
  let repo: jest.Mocked<IPlatformSettingsRepository>;
  let useCase: UpdatePlatformSettingsUseCase;

  beforeEach(() => {
    repo = {
      get: jest.fn(),
      save: jest.fn().mockResolvedValue(PlatformSettings.defaults().withPatch({ currency: 'EUR' })),
    };
    useCase = new UpdatePlatformSettingsUseCase(repo);
  });

  it('saves the patch for SUPER_ADMIN', async () => {
    const result = await useCase.execute({
      callerRole: UserRole.SUPER_ADMIN,
      patch: { currency: 'EUR' },
    });
    expect(repo.save).toHaveBeenCalledWith({ currency: 'EUR' });
    expect(result.currency).toBe('EUR');
  });

  // This is the one guard that matters most here: SUPER_ADMIN is the only role
  // that can even reach this row, but the check still has to be real rather
  // than implied by "only the platform router calls this," in case a future
  // caller composes it differently.
  it.each([UserRole.BUSINESS_OWNER, UserRole.STAFF])('refuses %s', async (role) => {
    await expect(
      useCase.execute({ callerRole: role, patch: { currency: 'EUR' } })
    ).rejects.toThrow(UnauthorizedError);
    expect(repo.save).not.toHaveBeenCalled();
  });
});
