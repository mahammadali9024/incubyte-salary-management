import { z } from 'zod';

export const MIN_PASSWORD_LENGTH = 8;

export const registerSchema = z.object({
  email: z.string().trim().toLowerCase().pipe(z.email('Enter a valid email')),
  password: z
    .string()
    .min(MIN_PASSWORD_LENGTH, `Use at least ${MIN_PASSWORD_LENGTH} characters`)
    .max(200, 'Password is too long'),
});
