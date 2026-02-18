import { z } from 'zod/v4';

export const createCategorySchema = z.object({
  name: z.string().min(1, 'Il nome è obbligatorio').max(50),
  icon: z.string().max(10).optional(),
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, 'Colore non valido')
    .optional(),
  type: z.enum(['expense', 'income']).optional(),
});

export const updateCategorySchema = createCategorySchema.partial();

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
