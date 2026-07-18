import { InvalidStockMovementError } from './errors';

export enum StockMovementType {
  ADJUSTMENT = 'ADJUSTMENT',
  TRANSFER = 'TRANSFER'
}

export interface StockMovementProps {
  id: string;
  tenantId: string;
  productId: string;
  warehouseId?: string | null;
  fromWarehouseId?: string | null;
  toWarehouseId?: string | null;
  quantity: number;
  type: StockMovementType;
  reason?: string;
  createdBy: string;
  createdAt?: Date;
}

export class StockMovement {
  public readonly id: string;
  public readonly tenantId: string;
  public readonly productId: string;
  public readonly warehouseId: string | null;
  public readonly fromWarehouseId: string | null;
  public readonly toWarehouseId: string | null;
  public readonly quantity: number;
  public readonly type: StockMovementType;
  public readonly reason: string | null;
  public readonly createdBy: string;
  public readonly createdAt: Date;

  private constructor(props: StockMovementProps) {
    this.id = props.id;
    this.tenantId = props.tenantId;
    this.productId = props.productId;
    this.warehouseId = props.warehouseId ?? null;
    this.fromWarehouseId = props.fromWarehouseId ?? null;
    this.toWarehouseId = props.toWarehouseId ?? null;
    this.quantity = props.quantity;
    this.type = props.type;
    this.reason = props.reason ?? null;
    this.createdBy = props.createdBy;
    this.createdAt = props.createdAt ?? new Date();
  }

  public static create(props: StockMovementProps): StockMovement {
    if (props.type === StockMovementType.ADJUSTMENT) {
      if (!props.warehouseId) {
        throw new InvalidStockMovementError('ADJUSTMENT must have a warehouseId');
      }
      if (props.fromWarehouseId || props.toWarehouseId) {
        throw new InvalidStockMovementError('ADJUSTMENT cannot have fromWarehouseId or toWarehouseId');
      }
    } else if (props.type === StockMovementType.TRANSFER) {
      if (props.warehouseId) {
        throw new InvalidStockMovementError('TRANSFER cannot have a warehouseId');
      }
      if (!props.fromWarehouseId || !props.toWarehouseId) {
        throw new InvalidStockMovementError('TRANSFER must have both fromWarehouseId and toWarehouseId');
      }
      if (props.fromWarehouseId === props.toWarehouseId) {
        throw new InvalidStockMovementError('TRANSFER source and destination cannot be the same');
      }
    }

    if (props.quantity === 0) {
        throw new InvalidStockMovementError('Stock movement quantity cannot be zero');
    }

    return new StockMovement(props);
  }
}
