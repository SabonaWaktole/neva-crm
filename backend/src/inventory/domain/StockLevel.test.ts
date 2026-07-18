import { StockLevel } from './StockLevel';
import { NegativeStockError, CrossTenantIsolationError } from './errors';

describe('StockLevel', () => {
  it('should reject negative quantities on creation', () => {
    expect(() => {
      StockLevel.create({
        id: 'sl1',
        tenantId: 'tenant1',
        productId: 'p1',
        productTenantId: 'tenant1',
        warehouseId: 'w1',
        warehouseTenantId: 'tenant1',
        quantity: -5
      });
    }).toThrow(NegativeStockError);
  });

  it('should reject cross-tenant productId', () => {
    expect(() => {
      StockLevel.create({
        id: 'sl1',
        tenantId: 'tenant1',
        productId: 'p1',
        productTenantId: 'tenant2', // Mismatch
        warehouseId: 'w1',
        warehouseTenantId: 'tenant1',
        quantity: 10
      });
    }).toThrow(CrossTenantIsolationError);
  });

  it('should reject cross-tenant warehouseId', () => {
    expect(() => {
      StockLevel.create({
        id: 'sl1',
        tenantId: 'tenant1',
        productId: 'p1',
        productTenantId: 'tenant1',
        warehouseId: 'w1',
        warehouseTenantId: 'tenant2', // Mismatch
        quantity: 10
      });
    }).toThrow(CrossTenantIsolationError);
  });

  it('should adjust quantity successfully and reject dropping below zero', () => {
    const stockLevel = StockLevel.create({
      id: 'sl1',
      tenantId: 'tenant1',
      productId: 'p1',
      productTenantId: 'tenant1',
      warehouseId: 'w1',
      warehouseTenantId: 'tenant1',
      quantity: 10
    });

    stockLevel.adjustQuantity(5);
    expect(stockLevel.quantity).toBe(15);

    stockLevel.adjustQuantity(-10);
    expect(stockLevel.quantity).toBe(5);

    expect(() => {
      stockLevel.adjustQuantity(-10);
    }).toThrow(NegativeStockError);

    // Quantity should remain unchanged after a failed adjustment
    expect(stockLevel.quantity).toBe(5);
  });
});
