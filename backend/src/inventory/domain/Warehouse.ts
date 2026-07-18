export interface WarehouseProps {
  id: string;
  tenantId: string;
  name: string;
  address?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export class Warehouse {
  public readonly id: string;
  public readonly tenantId: string;
  public name: string;
  public address: string | null;
  public readonly createdAt: Date;
  public updatedAt: Date;

  private constructor(props: WarehouseProps) {
    this.id = props.id;
    this.tenantId = props.tenantId;
    this.name = props.name;
    this.address = props.address ?? null;
    this.createdAt = props.createdAt ?? new Date();
    this.updatedAt = props.updatedAt ?? new Date();
  }

  public static create(props: WarehouseProps): Warehouse {
    if (!props.name) throw new Error('Warehouse name is required');
    return new Warehouse(props);
  }

  public update(props: Partial<Pick<WarehouseProps, 'name' | 'address'>>): void {
    if (props.name) this.name = props.name;
    if (props.address !== undefined) this.address = props.address ?? null;
    this.updatedAt = new Date();
  }
}
