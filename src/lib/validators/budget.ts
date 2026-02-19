import { z } from 'zod/v4';

export const createBudgetSchema = z
  .object({
    amount: z.number().positive("L'importo deve essere positivo"),
    period: z.enum(['monthly', 'annual']),
    month: z.number().int().min(1).max(12).optional(),
    year: z.number().int().min(2020).max(2100),
    categoryId: z.string().min(1, 'La categoria è obbligatoria'),
  })
  .refine(
    (data) => {
      if (data.period === 'monthly' && !data.month) return false;
      return true;
    },
    { message: 'Il mese è obbligatorio per budget mensili' },
  );

export const updateBudgetSchema = z.object({
  amount: z.number().positive("L'importo deve essere positivo").optional(),
});

export const budgetFiltersSchema = z.object({
  year: z.coerce.number().int().min(2020).max(2100).optional(),
  month: z.coerce.number().int().min(1).max(12).optional(),
});

export type CreateBudgetInput = z.infer<typeof createBudgetSchema>;
export type UpdateBudgetInput = z.infer<typeof updateBudgetSchema>;
export type BudgetFilters = z.infer<typeof budgetFiltersSchema>;
