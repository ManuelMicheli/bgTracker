import { z } from 'zod/v4';

export const createTransactionSchema = z.object({
  amount: z.number().positive('L\'importo deve essere positivo'),
  description: z.string().min(1, 'La descrizione è obbligatoria').max(200),
  date: z.iso.datetime().optional(),
  type: z.enum(['expense', 'income']).optional(),
  source: z.enum(['manual', 'telegram', 'csv']).optional(),
  notes: z.string().max(500).optional(),
  categoryId: z.string().min(1, 'La categoria è obbligatoria'),
});

export const updateTransactionSchema = createTransactionSchema.partial();

export const transactionFiltersSchema = z.object({
  type: z.enum(['expense', 'income']).optional(),
  categoryId: z.string().optional(),
  from: z.iso.datetime().optional(),
  to: z.iso.datetime().optional(),
  page: z.coerce.number().int().positive().optional(),
  pageSize: z.coerce.number().int().min(1).max(100).optional(),
});

export type CreateTransactionInput = z.infer<typeof createTransactionSchema>;
export type UpdateTransactionInput = z.infer<typeof updateTransactionSchema>;
export type TransactionFilters = z.infer<typeof transactionFiltersSchema>;
