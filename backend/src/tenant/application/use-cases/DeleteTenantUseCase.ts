import { ITenantRepository } from '../../domain/repositories/ITenantRepository';
import { ITenantDeletionTransaction } from '../ports/ITenantDeletionTransaction';
import { ITenantMediaCleaner } from '../ports/ITenantMediaCleaner';
import { IAuditLogger } from '../../../shared/application/ports/IAuditLogger';
import { UserRole } from '../../../auth/domain/enums/UserRole';
import { UnauthorizedError } from '../../../auth/domain/errors';
import { TenantNotFoundError } from '../../domain/errors';
import { ConfirmationMismatchError } from '../../domain/errors/ConfirmationMismatchError';

export interface DeleteTenantDTO {
  callerRole: string;
  /** The Super Admin performing the deletion — recorded as the audit entry's actor. */
  callerId: string;
  tenantId: string;
  /**
   * The caller must type the workspace's own slug to proceed — the same
   * "type to confirm" pattern as GitHub repo deletion. This is the only
   * platform action that destroys data outright, so a slip of a double-click
   * must not be enough to trigger it.
   */
  confirmSlug: string;
}

/**
 * Permanently deletes a workspace: every database row that belongs to it and
 * every file it ever stored on disk.
 *
 * **Irreversible, unlike `SetTenantSubscriptionStatusUseCase`.** Suspension
 * is the reversible way to stop a workspace; this is the destructive one, and
 * the two are deliberately separate use cases so neither code path can be
 * mistaken for the other's consequences.
 *
 * Order matters and is NOT interchangeable: the database delete runs first,
 * inside a transaction that leaves the workspace untouched if it fails
 * partway through. Only once that has actually committed do we remove the
 * files from disk — a failure there is logged and swallowed rather than
 * thrown, because by that point the workspace is already gone from the
 * database and re-surfacing the delete as "failed" to the caller would be a
 * lie; leaving orphaned files on disk is the lesser problem of the two.
 */
export class DeleteTenantUseCase {
  constructor(
    private readonly tenantRepo: ITenantRepository,
    private readonly deletionTx: ITenantDeletionTransaction,
    private readonly mediaCleaner: ITenantMediaCleaner,
    /**
     * Optional so every existing test double that constructs this use case
     * with three arguments keeps compiling. Absent, the deletion still runs;
     * it simply leaves no TENANT_DELETED audit entry behind.
     */
    private readonly auditLogger?: IAuditLogger
  ) {}

  async execute(dto: DeleteTenantDTO): Promise<void> {
    if (dto.callerRole !== UserRole.SUPER_ADMIN) {
      throw new UnauthorizedError('Only Super Admins can delete a workspace');
    }

    const tenant = await this.tenantRepo.findById(dto.tenantId);
    if (!tenant) {
      throw new TenantNotFoundError(dto.tenantId);
    }

    if (dto.confirmSlug !== tenant.urlSlug) {
      throw new ConfirmationMismatchError();
    }

    await this.deletionTx.run(dto.tenantId);

    // AuditLog has no foreign key onto Tenant (see schema comment), so this
    // write is valid even though the tenant row above is already gone.
    await this.auditLogger?.record({
      actorUserId: dto.callerId,
      actorRole: dto.callerRole,
      action: 'TENANT_DELETED',
      targetType: 'TENANT',
      targetId: dto.tenantId,
      tenantId: dto.tenantId,
      metadata: { companyName: tenant.name, urlSlug: tenant.urlSlug },
    });

    try {
      await this.mediaCleaner.removeAll(dto.tenantId);
    } catch (error) {
      // Best-effort: the workspace's data is already gone. An orphaned
      // uploads/{tenantId} folder is a disk-space cleanup issue, not a reason
      // to report this operation as failed.
      console.error(`Failed to remove media for deleted tenant ${dto.tenantId}`, error);
    }
  }
}
