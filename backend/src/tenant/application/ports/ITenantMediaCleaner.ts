/**
 * Removes every file a workspace ever stored on disk — logos, cover images,
 * user avatars, product galleries — everything `MediaService` ever wrote
 * under that tenant's folder.
 *
 * Kept separate from `ITenantDeletionTransaction`: the database delete must
 * be transactional and reversible-on-failure, while disk removal is neither
 * (there is no filesystem transaction), so the two are sequenced explicitly
 * by `DeleteTenantUseCase` rather than pretending they are one atomic step.
 */
export interface ITenantMediaCleaner {
  removeAll(tenantId: string): Promise<void>;
}
