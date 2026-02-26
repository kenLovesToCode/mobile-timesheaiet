import * as z from 'zod';

const barcodeSchema = z
  .string()
  .trim()
  .min(1, 'barcode is required')
  .max(64, 'barcode must be 64 characters or fewer');

const productNameSchema = z
  .string()
  .trim()
  .min(1, 'product name is required')
  .max(160, 'product name must be 160 characters or fewer');

export const saveStorePriceInputSchema = z.object({
  barcode: barcodeSchema,
  storeId: z.number().int().positive('store id must be a positive integer'),
  priceCents: z
    .number()
    .int('price must be in whole cents')
    .positive('price must be greater than 0')
    .max(1_000_000, 'price is too large'),
  productName: productNameSchema.optional(),
});

export const resultsLookupInputSchema = z.object({
  barcode: barcodeSchema,
});

export type SaveStorePriceInput = z.infer<typeof saveStorePriceInputSchema>;
export type ResultsLookupInput = z.infer<typeof resultsLookupInputSchema>;

export class PricingValidationError extends Error {
  issues: z.ZodIssue[];

  constructor(issues: z.ZodIssue[]) {
    super(`Invalid pricing payload: ${issues.map((issue) => issue.message).join('; ')}`);
    this.name = 'PricingValidationError';
    this.issues = issues;
  }
}

function parseWithSchema<T>(input: unknown, schema: z.ZodSchema<T>): T {
  const result = schema.safeParse(input);

  if (!result.success) {
    throw new PricingValidationError(result.error.issues);
  }

  return result.data;
}

export function parseSaveStorePriceInput(input: unknown) {
  return parseWithSchema(input, saveStorePriceInputSchema);
}

export function parseResultsLookupInput(input: unknown) {
  return parseWithSchema(input, resultsLookupInputSchema);
}
