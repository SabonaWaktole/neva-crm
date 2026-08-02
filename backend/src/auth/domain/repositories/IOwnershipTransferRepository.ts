import { OwnershipTransfer } from '../entities/OwnershipTransfer';

export interface IOwnershipTransferRepository {
  findById(id: string): Promise<OwnershipTransfer | null>;
  /**
   * The unresolved transfer for a suspended owner, if any. Reactivation reads
   * this to decide whether it needs a restore/keep choice at all — a plain
   * suspension with no staff never created one.
   */
  findActiveByOriginalOwnerId(originalOwnerId: string): Promise<OwnershipTransfer | null>;
  /**
   * The unresolved transfer where a given user is currently standing in as
   * acting owner. Used to guard against deleting someone who is mid-transfer.
   */
  findActiveByActingOwnerId(actingOwnerId: string): Promise<OwnershipTransfer | null>;
}
