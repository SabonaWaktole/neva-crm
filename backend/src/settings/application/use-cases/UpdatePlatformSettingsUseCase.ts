import { IPlatformSettingsRepository } from '../../domain/IPlatformSettingsRepository';
import { PlatformSettingsPatch } from '../../domain/PlatformSettings';
import { UserRole } from '../../../auth/domain/enums/UserRole';
import { UnauthorizedError } from '../../../auth/domain/errors';

/**
 * Sets the values a NEWLY provisioned workspace starts with.
 *
 * Never touches an existing tenant — see the schema comment on the
 * `PlatformSettings` model and `CreateTenantWithOwnerUseCase`, the only reader
 * of this row. A platform admin who wants to change an EXISTING workspace's
 * settings uses the separate bulk-apply action, which is a distinct,
 * explicitly-scoped operation rather than a side effect of this one.
 */
export class UpdatePlatformSettingsUseCase {
  constructor(private platformSettingsRepository: IPlatformSettingsRepository) {}

  async execute(input: { callerRole: string; patch: PlatformSettingsPatch }) {
    if (input.callerRole !== UserRole.SUPER_ADMIN) {
      throw new UnauthorizedError('Only platform administrators can change platform-wide settings.');
    }
    return this.platformSettingsRepository.save(input.patch);
  }
}
