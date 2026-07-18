import { NegativeStockError, CrossTenantIsolationError } from './errors';

export interface StockLevelProps {
  id: string;
  tenantId: string;
  productId: string;
  productTenantId: string; // Used to verify cross-tenant isolation during creation
  warehouseId: string;
  warehouseTenantId: string; // Used to verify cross-tenant isolation during creation
  quantity: number;
}

export class StockLevel {
  public readonly id: string;
  public readonly tenantId: string;
  public readonly productId: string;
  public readonly warehouseId: string;
  public quantity: number;

  private constructor(props: Omit<StockLevelProps, 'productTenantId' | 'warehouseTenantId'>) {
    this.id = props.id;
    this.tenantId = props.tenantId;
    this.productId = props.productId;
    this.warehouseId = props.warehouseId;
    this.quantity = props.quantity;
  }

  public static create(props: StockLevelProps): StockLevel {
    if (props.quantity < 0) {
      throw new NegativeStockError();
    }
    
    if (props.tenantId !== props.productTenantId) {
      throw new CrossTenantIsolationError(`Product ${props.productId} belongs to a different tenant.`);
    }

    if (props.tenantId !== props.warehouseTenantId) {
      throw new CrossTenantIsolationError(`Warehouse ${props.warehouseId} belongs to a different tenant.`);
    }

    return new StockLevel({
      id: props.id,
      tenantId: props.tenantId,
      productId: props.productId,
      warehouseId: props.warehouseId,
      quantity: props.quantity
    });
  }

  public adjustQuantity(amount: number): void {
    const newQuantity = this.quantity + amount;
    if (newQuantity < 0) {
      throw new NegativeStockError(`Cannot reduce stock by ${Math.abs(amount)}. Current quantity is ${this.quantity}.`);
    }
    this.quantity = newQuantity;
  }
}
