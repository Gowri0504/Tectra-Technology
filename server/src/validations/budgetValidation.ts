import { z } from 'zod';

export const budgetSchema = z.object({
  body: z.object({
    category: z.string().min(1, 'Category is required'),
    amount: z.number().positive('Amount must be positive'),
    period: z.string().regex(/^\d{4}-\d{2}$/, 'Period must be in YYYY-MM format'),
  }),
});

export const getBudgetsSchema = z.object({
  query: z.object({
    period: z.string().regex(/^\d{4}-\d{2}$/, 'Period must be in YYYY-MM format').optional(),
  }),
});
