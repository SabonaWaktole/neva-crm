import { OwnershipTransfer } from '../../domain/entities/OwnershipTransfer';

/**
 * Multi-row writes around a Business-Owner ownership handover, each run
 * inside one `$transaction` so a failure partway through never leaves a
 * workspace with two owners, no owner, or a transfer row that does not match
 * what the User rows actually say.
 *
 * Modelled on `ITenantDeletionTransaction`: the use cases that call these
 * (`SuspendUserUseCase`, `ReactivateUserUseCase`, `DeleteUserUseCase`) own the
 * business rules (who may act, when a transfer is required); this port only
 * owns making the resulting writes atomic.
 */
export interface IOwnershipTransactions {
  /**
   * Suspending a Business Owner who has other active staff: the owner goes
   * inactive, the chosen staff member is promoted to BUSINESS_OWNER (their
   * prior role/warehouse saved for a possible restore), and an ACTIVE
   * `OwnershipTransfer` row is created to record it.
   */
  promoteForSuspension(params: {
    id: string;
    tenantId: string;
    originalOwnerId: string;
    actingOwnerId: string;
    actingOwnerRole: string;
    actingOwnerWarehouseId: string | null;
    createdByUserId: string;
  }): Promise<OwnershipTransfer>;

  /** Reactivation, "Restore Original Ownership": undo the promotion above. */
  restoreOwnership(transferId: string, resolvedByUserId: string): Promise<void>;

  /**
   * Reactivation, "Keep Current Ownership": the acting owner stays
   * BUSINESS_OWNER, the original owner returns as STAFF.
   */
  keepOwnership(transferId: string, resolvedByUserId: string): Promise<void>;

  /**
   * Deleting a Business Owner who has other active staff: the chosen staff
   * member is permanently promoted to BUSINESS_OWNER. No transfer row —
   * deletion has no "restore" to come back to.
   */
  promoteForDeletion(params: { actingOwnerId: string }): Promise<void>;
}
