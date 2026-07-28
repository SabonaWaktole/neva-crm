import { INotificationSettingsRepository } from '../domain/INotificationSettingsRepository';
import { NotificationSettings, NotificationSettingsPatch } from '../domain/NotificationSettings';
import { UserRole } from '../../auth/domain/enums/UserRole';
import { UnauthorizedError } from '../../auth/domain/errors';

export interface UpdateNotificationSettingsDTO {
  tenantId: string;
  requestingUserRole: string;
  patch: NotificationSettingsPatch;
}

export class UpdateNotificationSettingsUseCase {
  constructor(private readonly repo: INotificationSettingsRepository) {}

  async execute(dto: UpdateNotificationSettingsDTO): Promise<NotificationSettings> {
    /*
     * BUSINESS_OWNER only, and SUPER_ADMIN explicitly not — matching
     * UpdateTenantSettingsUseCase. A platform admin has no business deciding
     * who a workspace emails, and admitting it here would reopen the
     * cross-tenant reach that resolveTenant closes everywhere else.
     */
    if (dto.requestingUserRole !== UserRole.BUSINESS_OWNER) {
      throw new UnauthorizedError('Only Business Owners can update notification settings.');
    }

    const current = await this.repo.get(dto.tenantId);
    // Validation lives in the entity: `withPatch` checks the RESULT, so a
    // partial update cannot reach a state a full write would have refused.
    const updated = current.withPatch(dto.patch);
    await this.repo.save(updated);
    return updated;
  }
}
