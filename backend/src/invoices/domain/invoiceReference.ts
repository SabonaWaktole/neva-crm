/**
 * The human-facing reference for an invoice.
 *
 * Mirrors `quotationReference` for the same reason: the frontend needs a short
 * code to display, and consistency with the quotation module beats inventing a
 * second convention. Same TD-021 caveat applies — this is not a guaranteed-unique
 * identifier, just the first eight hex characters of the id.
 */
export function invoiceReference(invoiceId: string): string {
  return invoiceId.split('-')[0].toUpperCase();
}
