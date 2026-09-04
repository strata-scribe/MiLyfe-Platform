import { z } from 'zod';

export const emailSchema = z
  .string()
  .min(1, 'Email is required')
  .email('Invalid email address');

export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
    'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
  );

export const usernameSchema = z
  .string()
  .min(3, 'Username must be at least 3 characters')
  .max(20, 'Username must be at most 20 characters')
  .regex(
    /^[a-zA-Z0-9_]+$/,
    'Username can only contain alphanumeric characters and underscores'
  );

export const urlSchema = z
  .string()
  .url('Invalid URL')
  .optional()
  .or(z.literal(''));

export const amountSchema = z
  .number()
  .positive('Amount must be positive')
  .max(1000000, 'Amount cannot exceed 1,000,000');

export function validate<T>(schema: z.ZodSchema<T>, data: unknown) {
  try {
    const validData = schema.parse(data);
    return { success: true as const, data: validData };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false as const, errors: error.errors };
    }
    throw error;
  }
}
