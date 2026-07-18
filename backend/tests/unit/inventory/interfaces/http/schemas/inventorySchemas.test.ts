import { adjustStockSchema } from '../../../../../../src/inventory/interfaces/http/schemas';

describe('Inventory Zod Schemas', () => {
  describe('adjustStockSchema', () => {
    it('should successfully parse a valid payload with quantityChange', () => {
      const payload = {
        warehouseId: 'w-1',
        quantityChange: 50,
        reason: 'Restocking',
      };

      const result = adjustStockSchema.safeParse(payload);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.quantityChange).toBe(50);
        expect(result.data.warehouseId).toBe('w-1');
        expect(result.data.reason).toBe('Restocking');
      }
    });

    it('should successfully parse a negative quantityChange', () => {
      const payload = {
        warehouseId: 'w-1',
        quantityChange: -10,
      };

      const result = adjustStockSchema.safeParse(payload);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.quantityChange).toBe(-10);
      }
    });

    it('should fail if quantityChange is missing', () => {
      const payload = {
        warehouseId: 'w-1',
        reason: 'Missing quantity change',
      };

      const result = adjustStockSchema.safeParse(payload);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].path).toEqual(['quantityChange']);
        expect(result.error.errors[0].message).toBe('Required');
      }
    });
  });
});
