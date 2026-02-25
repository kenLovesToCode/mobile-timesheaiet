import * as z from 'zod';

const storeNameSchema = z
  .string()
  .trim()
  .min(1, 'store name is required')
  .max(80, 'store name must be 80 characters or fewer');

export const createStoreInputSchema = z.object({
  name: storeNameSchema,
});

export const updateStoreNameInputSchema = z.object({
  id: z.number().int().positive('store id must be a positive integer'),
  name: storeNameSchema,
});

export const toggleStoreActiveInputSchema = z.object({
  id: z.number().int().positive('store id must be a positive integer'),
  isActive: z.boolean(),
});

export type CreateStoreInput = z.infer<typeof createStoreInputSchema>;
export type UpdateStoreNameInput = z.infer<typeof updateStoreNameInputSchema>;
export type ToggleStoreActiveInput = z.infer<typeof toggleStoreActiveInputSchema>;

export class StoreValidationError extends Error {
  issues: z.ZodIssue[];

  constructor(issues: z.ZodIssue[]) {
    super(`Invalid store payload: ${issues.map((issue) => issue.message).join('; ')}`);
    this.name = 'StoreValidationError';
    this.issues = issues;
  }
}

function parseWithSchema<T>(input: unknown, schema: z.ZodSchema<T>): T {
  const result = schema.safeParse(input);

  if (!result.success) {
    throw new StoreValidationError(result.error.issues);
  }

  return result.data;
}

export function parseCreateStoreInput(input: unknown) {
  return parseWithSchema(input, createStoreInputSchema);
}

export function parseUpdateStoreNameInput(input: unknown) {
  return parseWithSchema(input, updateStoreNameInputSchema);
}

export function parseToggleStoreActiveInput(input: unknown) {
  return parseWithSchema(input, toggleStoreActiveInputSchema);
}

