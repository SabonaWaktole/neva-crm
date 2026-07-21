import { QuotationStatus } from '../../../../../../src/quotations/domain/Quotation';
import {
  createQuotationSchema,
  updateQuotationSchema,
  searchQuotationsSchema,
  markAcceptedSchema,
} from '../../../../../../src/quotations/interfaces/http/schemas/quotationSchemas';

describe('Quotation Schemas', () => {
  const validUUID = '123e4567-e89b-12d3-a456-426614174000';

  describe('createQuotationSchema', () => {
    it('should validate a correct payload', () => {
      const result = createQuotationSchema.safeParse({
        clientId: validUUID,
        lineItems: [
          {
            productId: validUUID,
            warehouseId: validUUID,
            quantity: 5,
            unitPrice: 100.50,
          },
        ],
      });
      expect(result.success).toBe(true);
    });

    it('should reject if clientId is missing or invalid', () => {
      expect(createQuotationSchema.safeParse({ lineItems: [{ productId: validUUID, warehouseId: validUUID, quantity: 1, unitPrice: 10 }] }).success).toBe(false);
      expect(createQuotationSchema.safeParse({ clientId: '', lineItems: [{ productId: validUUID, warehouseId: validUUID, quantity: 1, unitPrice: 10 }] }).success).toBe(false);
    });

    it('should reject if lineItems is missing, empty, or invalid', () => {
      expect(createQuotationSchema.safeParse({ clientId: validUUID }).success).toBe(false);
      expect(createQuotationSchema.safeParse({ clientId: validUUID, lineItems: [] }).success).toBe(false);
      expect(createQuotationSchema.safeParse({ clientId: validUUID, lineItems: [{ productId: validUUID, warehouseId: validUUID, quantity: -1, unitPrice: 10 }] }).success).toBe(false);
      expect(createQuotationSchema.safeParse({ clientId: validUUID, lineItems: [{ productId: validUUID, warehouseId: validUUID, quantity: 1, unitPrice: -10 }] }).success).toBe(false);
    });
  });

  describe('updateQuotationSchema', () => {
    it('should validate a correct payload with lineItems', () => {
      const result = updateQuotationSchema.safeParse({
        lineItems: [
          {
            productId: validUUID,
            warehouseId: validUUID,
            quantity: 2,
            unitPrice: 50,
          },
        ],
      });
      expect(result.success).toBe(true);
    });

    it('should reject omitting lineItems', () => {
      const result = updateQuotationSchema.safeParse({});
      expect(result.success).toBe(false);
    });
  });

  describe('markAcceptedSchema', () => {
    it('should validate a correct payload', () => {
      expect(markAcceptedSchema.safeParse({ note: 'Accepted by client' }).success).toBe(true);
      expect(markAcceptedSchema.safeParse({}).success).toBe(true);
    });
  });

  describe('searchQuotationsSchema', () => {
    it('should validate correct queries', () => {
      expect(searchQuotationsSchema.safeParse({}).success).toBe(true);
      expect(searchQuotationsSchema.safeParse({ page: '2', limit: '20' }).success).toBe(true);
      expect(searchQuotationsSchema.safeParse({ status: QuotationStatus.Draft }).success).toBe(true);
    });

    it('should provide default pagination', () => {
      const parsed = searchQuotationsSchema.parse({});
      expect(parsed.page).toBe(1);
      expect(parsed.limit).toBe(10);
    });

    it('should reject invalid status', () => {
      expect(searchQuotationsSchema.safeParse({ status: 'INVALID_STATUS' }).success).toBe(false);
    });
  });
});
