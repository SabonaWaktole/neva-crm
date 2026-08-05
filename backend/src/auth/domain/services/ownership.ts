import { User } from '../entities/User';

/**
 * The other Business Owners a workspace would still have if `userId` stepped
 * away.
 *
 * A business is NOT limited to one Business Owner — a staff member can be
 * promoted, an owner can invite a colleague, and a Platform Admin can add or
 * invite one directly. Everything that asks "may this owner be suspended or
 * deleted, and does someone have to be promoted first?" is really asking
 * whether this list is empty, which is why the three places that ask it share
 * one answer instead of each re-deriving it.
 *
 * `deletedAt` is filtered as well as `isActive`: a soft-deleted account is
 * already inactive today, but a co-owner who no longer exists must never be
 * the reason a workspace is left with nobody in charge.
 */
export const otherActiveOwners = (owners: User[], userId: string): User[] =>
  owners.filter((owner) => owner.id !== userId && owner.isActive && !owner.deletedAt);
