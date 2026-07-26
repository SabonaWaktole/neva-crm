import { CrossTenantIsolationError } from './errors';

export interface ProductImageProps {
  id: string;
  tenantId: string;
  productId: string;
  productTenantId: string; // Used to verify cross-tenant isolation during creation
  url: string;
  url2x: string;
  width: number;
  height: number;
  bytes: number;
  position: number;
  createdAt?: Date;
}

/**
 * One rendition pair (@1x/@2x) in a product's gallery.
 *
 * `position` is what makes drag-to-reorder durable: the gallery is always read
 * back ordered by it, and position 0 is the image used wherever a single
 * thumbnail is shown.
 */
export class ProductImage {
  public readonly id: string;
  public readonly tenantId: string;
  public readonly productId: string;
  public readonly url: string;
  public readonly url2x: string;
  public readonly width: number;
  public readonly height: number;
  public readonly bytes: number;
  public position: number;
  public readonly createdAt: Date;

  private constructor(props: Omit<ProductImageProps, 'productTenantId'>) {
    this.id = props.id;
    this.tenantId = props.tenantId;
    this.productId = props.productId;
    this.url = props.url;
    this.url2x = props.url2x;
    this.width = props.width;
    this.height = props.height;
    this.bytes = props.bytes;
    this.position = props.position;
    this.createdAt = props.createdAt ?? new Date();
  }

  public static create(props: ProductImageProps): ProductImage {
    if (!props.id) throw new Error('ProductImage id is required');
    if (!props.url) throw new Error('ProductImage url is required');
    if (props.position < 0) throw new Error('ProductImage position cannot be negative');
    if (props.tenantId !== props.productTenantId) {
      throw new CrossTenantIsolationError(`Product ${props.productId} belongs to a different tenant.`);
    }

    const { productTenantId: _productTenantId, ...rest } = props;
    return new ProductImage(rest);
  }

  public moveTo(position: number): void {
    if (position < 0) throw new Error('ProductImage position cannot be negative');
    this.position = position;
  }
}
