export const OwnershipTransferStatus = {
  /** Suspension is in effect; the acting owner is standing in. */
  ACTIVE: 'ACTIVE',
  /** Reactivation restored the original owner and reverted the acting owner. */
  RESTORED: 'RESTORED',
  /** Reactivation kept the acting owner and returned the original owner as STAFF. */
  KEPT: 'KEPT',
  /**
   * Reactivation kept the acting owner AND returned the original owner as a
   * Business Owner — the workspace now has both. A workspace may have any
   * number of Business Owners, so this is a resolution in its own right and
   * not a variant of KEPT: nobody is demoted.
   */
  KEPT_BOTH: 'KEPT_BOTH',
} as const;

export type OwnershipTransferStatus =
  (typeof OwnershipTransferStatus)[keyof typeof OwnershipTransferStatus];

interface OwnershipTransferProps {
  id: string;
  tenantId: string;
  originalOwnerId: string;
  actingOwnerId: string;
  previousActingRole: string;
  previousActingWarehouseId: string | null;
  status: OwnershipTransferStatus;
  createdAt: Date;
  createdByUserId: string;
  resolvedAt: Date | null;
  resolvedByUserId: string | null;
}

/**
 * Record of a temporary Business-Owner promotion made when a Platform Admin
 * suspends an owner who still has active staff. A plain data holder — unlike
 * `User`/`Tenant` there is no invariant to enforce at construction, only a
 * shape to carry between the repository and the use cases that resolve it.
 */
export class OwnershipTransfer {
  public readonly id: string;
  public readonly tenantId: string;
  public readonly originalOwnerId: string;
  public readonly actingOwnerId: string;
  public readonly previousActingRole: string;
  public readonly previousActingWarehouseId: string | null;
  public readonly status: OwnershipTransferStatus;
  public readonly createdAt: Date;
  public readonly createdByUserId: string;
  public readonly resolvedAt: Date | null;
  public readonly resolvedByUserId: string | null;

  private constructor(props: OwnershipTransferProps) {
    this.id = props.id;
    this.tenantId = props.tenantId;
    this.originalOwnerId = props.originalOwnerId;
    this.actingOwnerId = props.actingOwnerId;
    this.previousActingRole = props.previousActingRole;
    this.previousActingWarehouseId = props.previousActingWarehouseId;
    this.status = props.status;
    this.createdAt = props.createdAt;
    this.createdByUserId = props.createdByUserId;
    this.resolvedAt = props.resolvedAt;
    this.resolvedByUserId = props.resolvedByUserId;
  }

  public static create(props: OwnershipTransferProps): OwnershipTransfer {
    return new OwnershipTransfer(props);
  }
}
