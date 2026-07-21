import { QuotationLineItem } from './QuotationLineItem';

describe('QuotationLineItem', () => {
  it('should create a valid line item', () => {
    const item = QuotationLineItem.create({
      id: 'li1',
      tenantId: 'tenant-1',
      quotationId: 'q1',
      productId: 'prod-1',
      warehouseId: 'wh-1',
      quantity: 5,
      unitPrice: 100
    });

    expect(item.quantity).toBe(5);
    expect(item.unitPrice).toBe(100);
    expect(item.lineTotal).toBe(500);
  });

  it('should reject quantity 0', () => {
    expect(() => {
      QuotationLineItem.create({
        id: 'li1',
        tenantId: 'tenant-1',
        quotationId: 'q1',
        productId: 'prod-1',
        warehouseId: 'wh-1',
        quantity: 0,
        unitPrice: 100
      });
    }).toThrow('Quantity must be greater than zero');
  });

  it('should reject negative quantity', () => {
    expect(() => {
      QuotationLineItem.create({
        id: 'li1',
        tenantId: 'tenant-1',
        quotationId: 'q1',
        productId: 'prod-1',
        warehouseId: 'wh-1',
        quantity: -5,
        unitPrice: 100
      });
    }).toThrow('Quantity must be greater than zero');
  });

  it('should reject negative unit price', () => {
    expect(() => {
      QuotationLineItem.create({
        id: 'li1',
        tenantId: 'tenant-1',
        quotationId: 'q1',
        productId: 'prod-1',
        warehouseId: 'wh-1',
        quantity: 5,
        unitPrice: -10
      });
    }).toThrow('Unit price cannot be negative');
  });
});
