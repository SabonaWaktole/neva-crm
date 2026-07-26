export interface StoredProductImage {
  /** Public URL of the @1x rendition. */
  url: string;
  /** Public URL of the @2x rendition, for srcset. */
  url2x: string;
  width: number;
  height: number;
  bytes: number;
}

/**
 * Where product photos physically live.
 *
 * The inventory module only needs "put this image somewhere and give me URLs"
 * and "forget this one"; keeping that behind a port means the use cases never
 * touch sharp or the filesystem, and can be tested with a stub.
 */
export interface IProductImageStorage {
  store(tenantId: string, buffer: Buffer): Promise<StoredProductImage>;
  /** Best-effort. A missing file must not fail the request that removes it. */
  remove(url: string | null | undefined): Promise<void>;
}
