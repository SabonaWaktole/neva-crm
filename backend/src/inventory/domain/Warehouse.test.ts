import { Warehouse } from './Warehouse';

describe('Warehouse', () => {
  it('should create a Warehouse', () => {
    const warehouse = Warehouse.create({
      id: 'w1',
      tenantId: 'tenant1',
      name: 'Main Hub'
    });

    expect(warehouse.name).toBe('Main Hub');
  });
});
