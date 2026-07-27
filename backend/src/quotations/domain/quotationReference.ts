/**
 * The human-facing reference for a quotation.
 *
 * The frontend has shown `id.split('-')[0].toUpperCase()` since the beginning,
 * and notifications must match what the user sees on the quotation page — a
 * notification naming a code that appears nowhere else is worse than one
 * naming nothing.
 *
 * This is NOT a good identifier, and TD-021 says so: eight hex characters are
 * not guaranteed unique and leak a database id. When a real per-tenant
 * sequence lands (`QUO-2026-0042`), this function is the single place both
 * sides change.
 */
export function quotationReference(quotationId: string): string {
  return quotationId.split('-')[0].toUpperCase();
}
