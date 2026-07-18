export interface ProductProps {
  id: string;
  tenantId: string;
  name: string;
  description: string;
  categoryId: string | null;
  price: number;
  lowStockThreshold?: number; // Optional in constructor
  createdAt?: Date;
  updatedAt?: Date;
}

export class Product {
  public readonly id: string;
  public readonly tenantId: string;
  public name: string;
  public description: string;
  public categoryId: string | null;
  public price: number;
  public lowStockThreshold: number; // Enforced as mandatory in entity
  public readonly createdAt: Date;
  public updatedAt: Date;

  private constructor(props: ProductProps) {
    this.id = props.id;
    this.tenantId = props.tenantId;
    this.name = props.name;
    this.description = props.description;
    this.categoryId = props.categoryId;
    this.price = props.price;
    // Default lowStockThreshold is enforced at the domain layer
    this.lowStockThreshold = props.lowStockThreshold ?? 10;
    this.createdAt = props.createdAt ?? new Date();
    this.updatedAt = props.updatedAt ?? new Date();
  }

  public static create(props: ProductProps): Product {
    if (!props.id) throw new Error('Product id is required');
    if (!props.tenantId) throw new Error('Product tenantId is required');
    if (!props.name) throw new Error('Product name is required');
    if (props.price < 0) throw new Error('Product price cannot be negative');

    return new Product(props);
  }

  public update(props: Partial<Pick<ProductProps, 'name' | 'description' | 'categoryId' | 'price' | 'lowStockThreshold'>>): void {
    if (props.name) this.name = props.name;
    if (props.description !== undefined) this.description = props.description;
    if (props.categoryId !== undefined) this.categoryId = props.categoryId;
    if (props.price !== undefined) {
        if (props.price < 0) throw new Error('Product price cannot be negative');
        this.price = props.price;
    }
    if (props.lowStockThreshold !== undefined) this.lowStockThreshold = props.lowStockThreshold;
    this.updatedAt = new Date();
  }
}
