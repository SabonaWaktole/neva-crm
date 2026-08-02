import { ITenantRepository, TenantSettingsUpdate } from '../../../tenant/domain/repositories/ITenantRepository';
import { UserRole } from '../../../auth/domain/enums/UserRole';
import { UnauthorizedError } from '../../../auth/domain/errors';

export interface BulkUpdateTenantSettingsDTO {
  callerRole: string;
  tenantIds: string[];
  settings: Omit<TenantSettingsUpdate, 'name'>;
}

/**
 * The platform console's "apply to selected tenants" action.
 *
 * Deliberately its own use case, not a loosened `UpdateTenantSettingsUseCase`.
 * That one explicitly rejects `SUPER_ADMIN` — a guard put there on purpose,
 * closing exactly the cross-tenant reach this feature asks for back open. This
 * use case is that reach, made real: a SEPARATE, explicitly-scoped operation a
 * platform admin reaches only from the platform console, never from inside a
 * single workspace's own settings page.
 *
 * Writes directly to the selected tenants' own settings — this is not a
 * "platform default" being pushed down; each write is indistinguishable from
 * that workspace's own Business Owner having made the same change themselves,
 * just applied to several at once. See `UpdatePlatformSettingsUseCase` for the
 * separate, non-retroactive concept of a default for future workspaces.
 */
export class BulkUpdateTenantSettingsUseCase {
  constructor(private tenantRepository: ITenantRepository) {}

  async execute(dto: BulkUpdateTenantSettingsDTO): Promise<{ updatedCount: number }> {
    if (dto.callerRole !== UserRole.SUPER_ADMIN) {
      throw new UnauthorizedError('Only platform administrators can apply settings across workspaces.');
    }

    const updatedCount = await this.tenantRepository.updateSettingsForMany(dto.tenantIds, dto.settings);
    return { updatedCount };
  }
}
