import { z } from 'zod';
import { QuotationStatus } from '../../../domain/Quotation';

export const quotationLineItemSchema = z.object({
  productId: z.string().min(1, 'Invalid productId'),
  warehouseId: z.string().min(1, 'Invalid warehouseId'),
  quantity: z.number().int().positive('Quantity must be greater than 0'),
  unitPrice: z.number().min(0, 'Unit price cannot be negative'),
});

export const createQuotationSchema = z.object({
  clientId: z.string().min(1, 'Invalid clientId'),
  lineItems: z.array(quotationLineItemSchema).min(1, 'At least one line item is required'),
});

export const updateQuotationSchema = z.object({
  lineItems: z.array(quotationLineItemSchema).min(1, 'At least one line item is required'),
});

export const submitQuotationSchema = z.object({});
export const approveQuotationSchema = z.object({});
export const returnToDraftSchema = z.object({});
export const expireQuotationSchema = z.object({});

export const markAcceptedSchema = z.object({
  note: z.string().optional(),
});

export const markRejectedSchema = z.object({
  note: z.string().optional(),
});

export const searchQuotationsSchema = z.object({
  query: z.string().optional(),
  status: z.nativeEnum(QuotationStatus).optional(),
  clientId: z.string().min(1, 'Invalid clientId').optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
});
