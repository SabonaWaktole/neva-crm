import fs from 'fs/promises';
import path from 'path';
import { UPLOADS_DIR } from '../../media/MediaService';
import { ITenantMediaCleaner } from '../application/ports/ITenantMediaCleaner';

/**
 * Deletes a tenant's entire upload folder — `MediaService.storeImage` writes
 * every logo, cover, avatar and product image under `UPLOADS_DIR/{tenantId}`
 * (see `storeImage`), so removing that one directory removes everything a
 * workspace ever put on disk. There is nothing per-file to enumerate first.
 */
export class FsTenantMediaCleaner implements ITenantMediaCleaner {
  async removeAll(tenantId: string): Promise<void> {
    const dir = path.join(UPLOADS_DIR, tenantId);

    // Path-traversal guard, same shape as MediaService.remove: tenantId is a
    // UUID we generated, but a stray "../" would still be refused rather than
    // trusted.
    const resolved = path.resolve(dir);
    if (!resolved.startsWith(path.resolve(UPLOADS_DIR) + path.sep)) return;

    await fs.rm(resolved, { recursive: true, force: true });
  }
}
