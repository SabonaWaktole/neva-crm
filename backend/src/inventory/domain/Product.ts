export interface ProductProps {
  id: string;
  tenantId: string;
  name: string;
  description: string;
  sku?: string | null;
  brand?: string | null;
  categoryId: string | null;
  price: number;
  cost?: number | null;
  tags?: string[];
  lowStockThreshold?: number; // Optional in constructor
  isArchived?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

/** Fields a caller may change after creation. */
export type ProductUpdateProps = Partial<
  Pick<
    ProductProps,
    | 'name'
    | 'description'
    | 'sku'
    | 'brand'
    | 'categoryId'
    | 'price'
    | 'cost'
    | 'tags'
    | 'lowStockThreshold'
    | 'isArchived'
  >
>;

/**
 * Trims, drops blanks and de-duplicates case-insensitively while keeping the
 * casing the user typed. Tags are a free-text facet, so without this a
 * catalogue quickly ends up with "Summer", "summer " and "SUMMER" as three
 * separate filter options.
 */
const normaliseTags = (tags: string[]): string[] => {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const raw of tags) {
    const tag = raw.trim();
    if (!tag) continue;
    const key = tag.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(tag);
  }
  return result;
};

/** Empty strings from a form mean "not set", not "set to blank". */
const normaliseOptionalText = (value: string | null | undefined): string | null => {
  if (value === null || value === undefined) return null;
  const trimmed = value.trim();
  return trimmed === '' ? null : trimmed;
};

export class Product {
  public readonly id: string;
  public readonly tenantId: string;
  public name: string;
  public description: string;
  public sku: string | null;
  public brand: string | null;
  public categoryId: string | null;
  public price: number;
  public cost: number | null;
  public tags: string[];
  public lowStockThreshold: number; // Enforced as mandatory in entity
  public isArchived: boolean;
  public readonly createdAt: Date;
  public updatedAt: Date;

  private constructor(props: ProductProps) {
    this.id = props.id;
    this.tenantId = props.tenantId;
    this.name = props.name;
    this.description = props.description;
    this.sku = normaliseOptionalText(props.sku);
    this.brand = normaliseOptionalText(props.brand);
    this.categoryId = props.categoryId;
    this.price = props.price;
    this.cost = props.cost ?? null;
    this.tags = normaliseTags(props.tags ?? []);
    // Default lowStockThreshold is enforced at the domain layer
    this.lowStockThreshold = props.lowStockThreshold ?? 10;
    this.isArchived = props.isArchived ?? false;
    this.createdAt = props.createdAt ?? new Date();
    this.updatedAt = props.updatedAt ?? new Date();
  }

  public static create(props: ProductProps): Product {
    if (!props.id) throw new Error('Product id is required');
    if (!props.tenantId) throw new Error('Product tenantId is required');
    if (!props.name) throw new Error('Product name is required');
    if (props.price < 0) throw new Error('Product price cannot be negative');
    if (props.cost !== undefined && props.cost !== null && props.cost < 0) {
      throw new Error('Product cost cannot be negative');
    }

    return new Product(props);
  }

  public update(props: ProductUpdateProps): void {
    if (props.name) this.name = props.name;
    if (props.description !== undefined) this.description = props.description;
    if (props.sku !== undefined) this.sku = normaliseOptionalText(props.sku);
    if (props.brand !== undefined) this.brand = normaliseOptionalText(props.brand);
    if (props.categoryId !== undefined) this.categoryId = props.categoryId;
    if (props.price !== undefined) {
        if (props.price < 0) throw new Error('Product price cannot be negative');
        this.price = props.price;
    }
    if (props.cost !== undefined) {
      if (props.cost !== null && props.cost < 0) throw new Error('Product cost cannot be negative');
      this.cost = props.cost;
    }
    if (props.tags !== undefined) this.tags = normaliseTags(props.tags);
    if (props.lowStockThreshold !== undefined) this.lowStockThreshold = props.lowStockThreshold;
    if (props.isArchived !== undefined) this.isArchived = props.isArchived;
    this.updatedAt = new Date();
  }
}
