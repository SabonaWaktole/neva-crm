import { z } from 'zod';
import { InvoiceStatus } from '../../../domain/Invoice';

export const convertToInvoiceSchema = z.object({
  // Accepted as a plain string and parsed by the controller — `dueDate` may
  // arrive as either a full ISO datetime or a bare `YYYY-MM-DD`, and coercing
  // both through `new Date(...)` there is simpler than two zod branches here.
  dueDate: z.string().min(1).optional(),
});

export const searchInvoicesSchema = z.object({
  query: z.string().optional(),
  status: z.nativeEnum(InvoiceStatus).optional(),
  clientId: z.string().min(1, 'Invalid clientId').optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
});
