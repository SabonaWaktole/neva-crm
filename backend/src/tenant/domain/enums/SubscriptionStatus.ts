/**
 * Whether a workspace is allowed to operate.
 *
 * Mirrors the `SubscriptionStatus` Prisma enum. Declared here as well, in the
 * same const-object style as {@link UserRole}, so the domain and application
 * layers never import from `@prisma/client` — the repository boundary is the
 * only place that knows Prisma exists.
 *
 * SUSPENDED retains all data. There is deliberately no value meaning "deleted":
 * hard deletion is a separate and more dangerous feature, and this type must
 * not be the thing that quietly grows one.
 */
export const SubscriptionStatus = {
  ACTIVE: 'ACTIVE',
  SUSPENDED: 'SUSPENDED',
} as const;

export type SubscriptionStatus = (typeof SubscriptionStatus)[keyof typeof SubscriptionStatus];
