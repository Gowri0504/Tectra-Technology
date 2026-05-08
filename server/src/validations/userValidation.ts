import { z } from 'zod';

export const userCreateSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    role: z.enum(['ADMIN', 'ACCOUNTANT', 'USER']).optional(),
  }),
});

export const userUpdateSchema = z.object({
  body: z.object({
    role: z.enum(['ADMIN', 'ACCOUNTANT', 'USER']).optional(),
  }),
});
