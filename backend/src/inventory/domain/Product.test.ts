import { Product } from './Product';

describe('Product', () => {
  it('should create a Product with a default lowStockThreshold of 10 if not provided', () => {
    const product = Product.create({
      id: 'p1',
      tenantId: 'tenant1',
      name: 'Test Product',
      description: 'Desc',
      categoryId: null,
      price: 100
    });

    expect(product.lowStockThreshold).toBe(10);
  });

  it('should accept an explicit lowStockThreshold', () => {
    const product = Product.create({
      id: 'p1',
      tenantId: 'tenant1',
      name: 'Test Product',
      description: 'Desc',
      categoryId: null,
      price: 100,
      lowStockThreshold: 5
    });

    expect(product.lowStockThreshold).toBe(5);
  });
});
