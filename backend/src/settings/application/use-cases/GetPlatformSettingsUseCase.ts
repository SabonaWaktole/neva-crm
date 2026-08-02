import { IPlatformSettingsRepository } from '../../domain/IPlatformSettingsRepository';
import { UserRole } from '../../../auth/domain/enums/UserRole';
import { UnauthorizedError } from '../../../auth/domain/errors';

export class GetPlatformSettingsUseCase {
  constructor(private platformSettingsRepository: IPlatformSettingsRepository) {}

  async execute(input: { callerRole: string }) {
    if (input.callerRole !== UserRole.SUPER_ADMIN) {
      throw new UnauthorizedError('Only platform administrators can view platform-wide settings.');
    }
    return this.platformSettingsRepository.get();
  }
}
