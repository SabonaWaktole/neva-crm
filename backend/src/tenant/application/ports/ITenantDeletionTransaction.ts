/**
 * Permanently erases a workspace and every row that belongs to it.
 *
 * Modelled on `ITenantProvisioningTransaction`, for the mirror-image reason:
 * a workspace is not one row, it is a whole subtree (users, clients,
 * quotations, inventory, notifications, ...), and most of those foreign keys
 * to Tenant have no `onDelete: Cascade` — several are deliberately
 * `RESTRICT` (see `QuotationStatusHistory.changedBy`). A bare
 * `prisma.tenant.delete()` would therefore fail with a foreign key violation
 * the moment the tenant has any data at all.
 *
 * The implementation deletes the whole subtree in FK-safe order inside one
 * transaction, so a failure partway through leaves the workspace exactly as
 * it was — never half-erased.
 */
export interface ITenantDeletionTransaction {
  run(tenantId: string): Promise<void>;
}
