import { StockMovement, StockMovementType } from './StockMovement';
import { InvalidStockMovementError } from './errors';

describe('StockMovement', () => {
  it('should accept valid ADJUSTMENT', () => {
    const movement = StockMovement.create({
      id: 'sm1',
      tenantId: 'tenant1',
      productId: 'p1',
      warehouseId: 'w1',
      quantity: 5,
      type: StockMovementType.ADJUSTMENT,
      createdBy: 'u1'
    });

    expect(movement.warehouseId).toBe('w1');
    expect(movement.fromWarehouseId).toBeNull();
    expect(movement.toWarehouseId).toBeNull();
  });

  it('should reject ADJUSTMENT with missing warehouseId', () => {
    expect(() => {
      StockMovement.create({
        id: 'sm1',
        tenantId: 'tenant1',
        productId: 'p1',
        quantity: 5,
        type: StockMovementType.ADJUSTMENT,
        createdBy: 'u1'
      });
    }).toThrow(InvalidStockMovementError);
  });

  it('should reject ADJUSTMENT with from/to set', () => {
    expect(() => {
      StockMovement.create({
        id: 'sm1',
        tenantId: 'tenant1',
        productId: 'p1',
        warehouseId: 'w1',
        fromWarehouseId: 'w2',
        quantity: 5,
        type: StockMovementType.ADJUSTMENT,
        createdBy: 'u1'
      });
    }).toThrow(InvalidStockMovementError);
  });

  it('should accept valid TRANSFER', () => {
    const movement = StockMovement.create({
      id: 'sm1',
      tenantId: 'tenant1',
      productId: 'p1',
      fromWarehouseId: 'w1',
      toWarehouseId: 'w2',
      quantity: 5,
      type: StockMovementType.TRANSFER,
      createdBy: 'u1'
    });

    expect(movement.warehouseId).toBeNull();
    expect(movement.fromWarehouseId).toBe('w1');
    expect(movement.toWarehouseId).toBe('w2');
  });

  it('should reject TRANSFER with warehouseId set', () => {
    expect(() => {
      StockMovement.create({
        id: 'sm1',
        tenantId: 'tenant1',
        productId: 'p1',
        warehouseId: 'w1',
        fromWarehouseId: 'w1',
        toWarehouseId: 'w2',
        quantity: 5,
        type: StockMovementType.TRANSFER,
        createdBy: 'u1'
      });
    }).toThrow(InvalidStockMovementError);
  });

  it('should reject TRANSFER with missing from/to', () => {
    expect(() => {
      StockMovement.create({
        id: 'sm1',
        tenantId: 'tenant1',
        productId: 'p1',
        fromWarehouseId: 'w1',
        quantity: 5,
        type: StockMovementType.TRANSFER,
        createdBy: 'u1'
      });
    }).toThrow(InvalidStockMovementError);
  });
});
