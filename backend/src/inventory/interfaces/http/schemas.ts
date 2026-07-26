import { z } from 'zod';

/** SKUs are printed, scanned and typed, so keep them short and predictable. */
const skuSchema = z
  .string()
  .max(64, 'SKU cannot be longer than 64 characters')
  .regex(/^[A-Za-z0-9._\-\/ ]*$/, 'SKU can only contain letters, numbers and - _ . /')
  .nullable()
  .optional();

const tagsSchema = z
  .array(z.string().trim().min(1, 'Tags cannot be blank').max(32, 'Tags are limited to 32 characters'))
  .max(20, 'A product can carry at most 20 tags')
  .optional();

export const createProductSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200),
  description: z.string(),
  sku: skuSchema,
  brand: z.string().max(120).nullable().optional(),
  categoryId: z.string().nullable().optional(),
  price: z.number().min(0, 'Price cannot be negative'),
  cost: z.number().min(0, 'Cost cannot be negative').nullable().optional(),
  tags: tagsSchema,
  lowStockThreshold: z.number().int().min(0).optional(),
  isArchived: z.boolean().optional(),
  initialStock: z.array(z.object({
    warehouseId: z.string(),
    quantity: z.number().min(0, 'Quantity cannot be negative'),
  })),
});

export const updateProductSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200).optional(),
  description: z.string().optional(),
  sku: skuSchema,
  brand: z.string().max(120).nullable().optional(),
  categoryId: z.string().nullable().optional(),
  price: z.number().min(0).optional(),
  cost: z.number().min(0, 'Cost cannot be negative').nullable().optional(),
  tags: tagsSchema,
  lowStockThreshold: z.number().int().min(0).optional(),
  isArchived: z.boolean().optional(),
});

export const bulkProductActionSchema = z.object({
  ids: z.array(z.string().min(1)).min(1, 'Select at least one product'),
  action: z.enum(['archive', 'unarchive', 'delete']),
});

export const reorderProductImagesSchema = z.object({
  imageIds: z.array(z.string().min(1)).min(1, 'An image order is required'),
});

/**
 * Query strings arrive as strings; this coerces the list controls into the
 * shapes the use case expects and drops anything unrecognised rather than
 * failing the whole request over a stale bookmarked URL.
 */
export const searchProductsQuerySchema = z.object({
  name: z.string().trim().min(1).optional(),
  categoryId: z.string().min(1).optional(),
  warehouseId: z.string().min(1).optional(),
  brand: z.string().min(1).optional(),
  tags: z
    .string()
    .optional()
    .transform((value) =>
      value
        ? value
            .split(',')
            .map((tag) => tag.trim())
            .filter(Boolean)
        : undefined
    ),
  availability: z.enum(['IN_STOCK', 'LOW_STOCK', 'OUT_OF_STOCK']).optional(),
  status: z.enum(['IN_STOCK', 'LOW_STOCK', 'OUT_OF_STOCK', 'ARCHIVED']).optional(),
  includeArchived: z
    .enum(['true', 'false'])
    .optional()
    .transform((value) => value === 'true'),
  sortBy: z.enum(['name', 'sku', 'price', 'cost', 'stock', 'createdAt', 'updatedAt']).optional(),
  sortDirection: z.enum(['asc', 'desc']).optional(),
  page: z.coerce.number().int().min(1).optional(),
  pageSize: z.coerce.number().int().min(1).max(100).optional(),
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
  description: z.string().optional(),
});

export const updateCategorySchema = z.object({
  name: z.string().optional(),
  description: z.string().optional(),
});
