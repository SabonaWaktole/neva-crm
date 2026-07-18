import { z } from 'zod';

export const createProductSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string(),
  categoryId: z.string().nullable().optional(),
  price: z.number().min(0, 'Price cannot be negative'),
  lowStockThreshold: z.number().min(0).optional(),
  initialStock: z.array(z.object({
    warehouseId: z.string(),
    quantity: z.number().min(0, 'Quantity cannot be negative'),
  })),
});

export const updateProductSchema = z.object({
  name: z.string().optional(),
  description: z.string().optional(),
  categoryId: z.string().nullable().optional(),
  price: z.number().min(0).optional(),
  lowStockThreshold: z.number().min(0).optional(),
});

export const adjustStockSchema = z.object({
  warehouseId: z.string(),
  quantityChange: z.number(), // Can be negative or positive
  reason: z.string().optional(),
});

export const transferStockSchema = z.object({
  fromWarehouseId: z.string(),
  toWarehouseId: z.string(),
  quantity: z.number().min(1, 'Transfer quantity must be positive'),
  reason: z.string().optional(),
});

export const createWarehouseSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  address: z.string().optional(),
});

export const updateWarehouseSchema = z.object({
  name: z.string().optional(),
  address: z.string().nullable().optional(),
});

export const createCategorySchema = z.object({
  name: z.string().min(1, 'Name is required'),
});

export const updateCategorySchema = z.object({
  name: z.string().optional(),
});
