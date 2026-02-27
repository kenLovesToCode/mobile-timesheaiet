import * as z from 'zod';

const barcodeSchema = z
  .string()
  .trim()
  .min(1, 'barcode is required')
  .max(64, 'barcode must be 64 characters or fewer');

const quantitySchema = z
  .number()
  .int('quantity must be a whole number')
  .min(1, 'quantity must be at least 1')
  .max(999, 'quantity is too large');

const productNameSchema = z
  .string()
  .trim()
  .min(1, 'product name is required')
  .max(160, 'product name must be 160 characters or fewer');

export const addOrUpdateShoppingListItemInputSchema = z.object({
  barcode: barcodeSchema,
  quantity: quantitySchema,
  productName: productNameSchema.optional(),
});

export const addOrIncrementShoppingListItemInputSchema = addOrUpdateShoppingListItemInputSchema;

export const shoppingListItemLookupSchema = z.object({
  barcode: barcodeSchema,
});

export const shoppingListItemQuantitySchema = z.object({
  barcode: barcodeSchema,
  quantity: quantitySchema,
});

export const shoppingListItemToggleSchema = z.object({
  barcode: barcodeSchema,
  isChecked: z.boolean(),
});

export type AddOrUpdateShoppingListItemInput = z.infer<
  typeof addOrUpdateShoppingListItemInputSchema
>;
export type AddOrIncrementShoppingListItemInput = z.infer<
  typeof addOrIncrementShoppingListItemInputSchema
>;
export type ShoppingListItemLookupInput = z.infer<typeof shoppingListItemLookupSchema>;
export type ShoppingListItemQuantityInput = z.infer<typeof shoppingListItemQuantitySchema>;
export type ShoppingListItemToggleInput = z.infer<typeof shoppingListItemToggleSchema>;

export class ShoppingListValidationError extends Error {
  issues: z.ZodIssue[];

  constructor(issues: z.ZodIssue[]) {
    super(`Invalid shopping list payload: ${issues.map((issue) => issue.message).join('; ')}`);
    this.name = 'ShoppingListValidationError';
    this.issues = issues;
  }
}

function parseWithSchema<T>(input: unknown, schema: z.ZodSchema<T>): T {
  const result = schema.safeParse(input);

  if (!result.success) {
    throw new ShoppingListValidationError(result.error.issues);
  }

  return result.data;
}

export function parseAddOrUpdateShoppingListItemInput(input: unknown) {
  return parseWithSchema(input, addOrUpdateShoppingListItemInputSchema);
}

export function parseAddOrIncrementShoppingListItemInput(input: unknown) {
  return parseWithSchema(input, addOrIncrementShoppingListItemInputSchema);
}

export function parseShoppingListItemLookupInput(input: unknown) {
  return parseWithSchema(input, shoppingListItemLookupSchema);
}

export function parseShoppingListItemQuantityInput(input: unknown) {
  return parseWithSchema(input, shoppingListItemQuantitySchema);
}

export function parseShoppingListItemToggleInput(input: unknown) {
  return parseWithSchema(input, shoppingListItemToggleSchema);
}
