import * as z from 'zod';

import { normalizeBarcodeValue } from '../../features/scan/scan-barcode';

const productNameSchema = z
  .string()
  .trim()
  .min(1, 'product name is required')
  .max(120, 'product name must be 120 characters or fewer');

const productBarcodeSchema = z
  .string()
  .trim()
  .transform((value, ctx) => {
    const normalized = normalizeBarcodeValue(value);
    if (!normalized) {
      ctx.addIssue({
        code: 'custom',
        message: 'barcode must be a valid UPC/EAN value',
      });
      return z.NEVER;
    }

    return normalized;
  });

export const createProductInputSchema = z.object({
  barcode: productBarcodeSchema,
  name: productNameSchema,
});

export const updateProductNameInputSchema = z.object({
  barcode: productBarcodeSchema,
  name: productNameSchema,
});

export const setProductActiveInputSchema = z.object({
  barcode: productBarcodeSchema,
  isActive: z.boolean(),
});

export const updateProductBarcodeInputSchema = z.object({
  currentBarcode: productBarcodeSchema,
  newBarcode: productBarcodeSchema,
});

export const listProductsInputSchema = z.object({
  query: z.string().trim().max(120).default(''),
  includeInactive: z.boolean().default(true),
});

export type CreateProductInput = z.infer<typeof createProductInputSchema>;
export type UpdateProductNameInput = z.infer<typeof updateProductNameInputSchema>;
export type SetProductActiveInput = z.infer<typeof setProductActiveInputSchema>;
export type UpdateProductBarcodeInput = z.infer<typeof updateProductBarcodeInputSchema>;
export type ListProductsInput = z.infer<typeof listProductsInputSchema>;

export class ProductValidationError extends Error {
  issues: z.ZodIssue[];

  constructor(issues: z.ZodIssue[]) {
    super(`Invalid product payload: ${issues.map((issue) => issue.message).join('; ')}`);
    this.name = 'ProductValidationError';
    this.issues = issues;
  }
}

function parseWithSchema<T>(input: unknown, schema: z.ZodSchema<T>): T {
  const result = schema.safeParse(input);

  if (!result.success) {
    throw new ProductValidationError(result.error.issues);
  }

  return result.data;
}

export function parseCreateProductInput(input: unknown) {
  return parseWithSchema(input, createProductInputSchema);
}

export function parseUpdateProductNameInput(input: unknown) {
  return parseWithSchema(input, updateProductNameInputSchema);
}

export function parseSetProductActiveInput(input: unknown) {
  return parseWithSchema(input, setProductActiveInputSchema);
}

export function parseUpdateProductBarcodeInput(input: unknown) {
  return parseWithSchema(input, updateProductBarcodeInputSchema);
}

export function parseListProductsInput(input: unknown) {
  return parseWithSchema(input, listProductsInputSchema);
}
