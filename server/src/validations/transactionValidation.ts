import { z } from 'zod';

export const createTransactionSchema = z.object({
  body: z.object({
    amount: z.coerce.number().positive('Amount must be positive'),
    type: z.enum(['INCOME', 'EXPENSE']),
    description: z.string().min(1, 'Description is required'),
    category: z.string().min(1, 'Category is required'),
    date: z.string().optional().transform(val => val ? new Date(val) : new Date()),
    tags: z.array(z.string()).optional(),
  }),
});

export const updateTransactionSchema = z.object({
  body: z.object({
    amount: z.coerce.number().positive('Amount must be positive').optional(),
    type: z.enum(['INCOME', 'EXPENSE']).optional(),
    description: z.string().min(1, 'Description is required').optional(),
    category: z.string().min(1, 'Category is required').optional(),
    date: z.string().optional().transform(val => val ? new Date(val) : undefined),
    tags: z.array(z.string()).optional(),
  }),
});

export const getTransactionsSchema = z.object({
  query: z.object({
    type: z.enum(['INCOME', 'EXPENSE']).optional(),
    category: z.string().optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    search: z.string().optional(),
    page: z.string().optional().transform(val => val ? parseInt(val, 10) : 1),
    limit: z.string().optional().transform(val => val ? parseInt(val, 10) : 10),
    cursor: z.string().optional(),
  }),
});
