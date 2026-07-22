export interface CategoryProps {
  id: string;
  tenantId: string;
  name: string;
  description?: string | null;
  isArchived?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export class Category {
  public readonly id: string;
  public readonly tenantId: string;
  public name: string;
  public description: string | null;
  public isArchived: boolean;
  public readonly createdAt: Date;
  public updatedAt: Date;

  private constructor(props: CategoryProps) {
    this.id = props.id;
    this.tenantId = props.tenantId;
    this.name = props.name;
    this.description = props.description ?? null;
    this.isArchived = props.isArchived ?? false;
    this.createdAt = props.createdAt ?? new Date();
    this.updatedAt = props.updatedAt ?? new Date();
  }

  public static create(props: CategoryProps): Category {
    if (!props.name) throw new Error('Category name is required');
    return new Category(props);
  }

  public update(props: Partial<Pick<CategoryProps, 'name' | 'description' | 'isArchived'>>): void {
    if (props.name) this.name = props.name;
    if (props.description !== undefined) this.description = props.description;
    if (props.isArchived !== undefined) this.isArchived = props.isArchived;
    this.updatedAt = new Date();
  }
}
