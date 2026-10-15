import { z } from 'zod';
import { ValidationError } from '../errors.js';

/**
 * Parses `data` with a Zod schema, throwing a ValidationError with per-field
 * messages the UI can show next to each input.
 */
export function validate(schema, data) {
  const result = schema.safeParse(data);
  if (!result.success) {
    throw new ValidationError('Invalid request', z.flattenError(result.error).fieldErrors);
  }
  return result.data;
}

export const idParam = z.coerce.number().int().positive();
