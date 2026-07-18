import { Category } from './Category';

describe('Category', () => {
  it('should create a Category', () => {
    const category = Category.create({
      id: 'c1',
      tenantId: 'tenant1',
      name: 'Electronics'
    });

    expect(category.name).toBe('Electronics');
  });
});
