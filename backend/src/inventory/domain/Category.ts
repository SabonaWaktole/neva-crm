export interface CategoryProps {
  id: string;
  tenantId: string;
  name: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export class Category {
  public readonly id: string;
  public readonly tenantId: string;
  public name: string;
  public readonly createdAt: Date;
  public updatedAt: Date;

  private constructor(props: CategoryProps) {
    this.id = props.id;
    this.tenantId = props.tenantId;
    this.name = props.name;
    this.createdAt = props.createdAt ?? new Date();
    this.updatedAt = props.updatedAt ?? new Date();
  }

  public static create(props: CategoryProps): Category {
    if (!props.name) throw new Error('Category name is required');
    return new Category(props);
  }

  public update(props: Partial<Pick<CategoryProps, 'name'>>): void {
    if (props.name) this.name = props.name;
    this.updatedAt = new Date();
  }
}
