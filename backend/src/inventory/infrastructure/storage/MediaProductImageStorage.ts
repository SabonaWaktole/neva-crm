import { MediaService, RenditionSpec } from '../../../media/MediaService';
import { IProductImageStorage, StoredProductImage } from '../../application/ports/IProductImageStorage';

/**
 * Product photos are art-directed by whoever uploads them and are shown at
 * wildly different sizes — a 48px table thumbnail and a full-width gallery
 * tile. `contain` keeps the whole product visible in both, and a square box
 * means a mixed catalogue of portrait and landscape shots still lines up in a
 * grid.
 */
export const PRODUCT_IMAGE_SPEC: RenditionSpec = {
  width: 1024,
  height: 1024,
  fit: 'contain',
};

/** Adapts the shared media pipeline to the inventory module's port. */
export class MediaProductImageStorage implements IProductImageStorage {
  constructor(private mediaService: MediaService = new MediaService()) {}

  async store(tenantId: string, buffer: Buffer): Promise<StoredProductImage> {
    const stored = await this.mediaService.storeImage(
      PRODUCT_IMAGE_SPEC,
      'product',
      tenantId,
      buffer
    );
    return {
      url: stored.url,
      url2x: stored.url2x,
      width: stored.width,
      height: stored.height,
      bytes: stored.bytes,
    };
  }

  async remove(url: string | null | undefined): Promise<void> {
    await this.mediaService.remove(url);
  }
}
