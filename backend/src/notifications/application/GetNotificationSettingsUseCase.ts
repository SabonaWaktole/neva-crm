import { INotificationSettingsRepository } from '../domain/INotificationSettingsRepository';
import { NotificationSettings } from '../domain/NotificationSettings';

/**
 * Readable by any member of the workspace.
 *
 * Staff cannot change the policy (see UpdateNotificationSettingsUseCase) but
 * they can see it, because it governs mail that lands in their own inbox.
 * Hiding it would make "why am I getting these?" unanswerable from inside the
 * product.
 */
export class GetNotificationSettingsUseCase {
  constructor(private readonly repo: INotificationSettingsRepository) {}

  async execute(tenantId: string): Promise<NotificationSettings> {
    if (!tenantId) throw new Error('Tenant ID is required');
    return this.repo.get(tenantId);
  }
}
