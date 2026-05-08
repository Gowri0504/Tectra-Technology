import { z } from 'zod';

const envSchema = z.object({
  NEXT_PUBLIC_API_URL: z.string().url().default('http://localhost:5000/api'),
});

// For client-side, we can't easily parse process.env in a strict way like backend 
// because only NEXT_PUBLIC_ variables are available.
// We'll export a safe object.

export const env = {
  API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api',
};
