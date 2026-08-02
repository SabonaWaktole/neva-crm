import { GetPlatformSettingsUseCase } from './GetPlatformSettingsUseCase';
import { IPlatformSettingsRepository } from '../../domain/IPlatformSettingsRepository';
import { PlatformSettings } from '../../domain/PlatformSettings';
import { UserRole } from '../../../auth/domain/enums/UserRole';
import { UnauthorizedError } from '../../../auth/domain/errors';

describe('GetPlatformSettingsUseCase', () => {
  let repo: jest.Mocked<IPlatformSettingsRepository>;
  let useCase: GetPlatformSettingsUseCase;

  beforeEach(() => {
    repo = { get: jest.fn().mockResolvedValue(PlatformSettings.defaults()), save: jest.fn() };
    useCase = new GetPlatformSettingsUseCase(repo);
  });

  it('returns the platform settings for SUPER_ADMIN', async () => {
    const result = await useCase.execute({ callerRole: UserRole.SUPER_ADMIN });
    expect(result.currency).toBe('USD');
    expect(repo.get).toHaveBeenCalled();
  });

  it.each([UserRole.BUSINESS_OWNER, UserRole.STAFF])(
    'refuses %s — this is a platform-level read',
    async (role) => {
      await expect(useCase.execute({ callerRole: role })).rejects.toThrow(UnauthorizedError);
      expect(repo.get).not.toHaveBeenCalled();
    }
  );
});
