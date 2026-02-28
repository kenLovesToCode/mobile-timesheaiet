import * as z from 'zod';

export const SHOPPING_LIST_QUANTITY_MAX = 999;

const barcodeSchema = z
  .string()
  .trim()
  .min(1, 'barcode is required')
  .max(64, 'barcode must be 64 characters or fewer');

const shoppingListIdSchema = z.number().int('shopping list id must be an integer').min(1);
const storeIdSchema = z.number().int('store id must be an integer').min(1);

const quantitySchema = z
  .number()
  .int('quantity must be a whole number')
  .min(1, 'quantity must be at least 1')
  .max(SHOPPING_LIST_QUANTITY_MAX, 'quantity is too large');

const productNameSchema = z
  .string()
  .trim()
  .min(1, 'product name is required')
  .max(160, 'product name must be 160 characters or fewer');

const statusSchema = z.enum(['active', 'done']);

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

export const createShoppingListInputSchema = z.object({
  storeId: storeIdSchema,
});

export const shoppingListIdInputSchema = z.object({
  shoppingListId: shoppingListIdSchema,
});

export const shoppingListStatusInputSchema = z.object({
  shoppingListId: shoppingListIdSchema,
  status: statusSchema,
});

export const shoppingListStoreProductsQuerySchema = z.object({
  shoppingListId: shoppingListIdSchema,
  query: z.string().trim().max(160, 'search query is too long').optional(),
});

export const upsertShoppingListCartItemInputSchema = z.object({
  shoppingListId: shoppingListIdSchema,
  barcode: barcodeSchema,
  quantity: quantitySchema,
  productName: productNameSchema.optional(),
  priceCents: z.number().int().min(0, 'price cents cannot be negative').optional(),
});

export const removeShoppingListCartItemInputSchema = z.object({
  shoppingListId: shoppingListIdSchema,
  barcode: barcodeSchema,
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
export type CreateShoppingListInput = z.infer<typeof createShoppingListInputSchema>;
export type ShoppingListIdInput = z.infer<typeof shoppingListIdInputSchema>;
export type ShoppingListStatusInput = z.infer<typeof shoppingListStatusInputSchema>;
export type ShoppingListStoreProductsQueryInput = z.infer<typeof shoppingListStoreProductsQuerySchema>;
export type UpsertShoppingListCartItemInput = z.infer<typeof upsertShoppingListCartItemInputSchema>;
export type RemoveShoppingListCartItemInput = z.infer<typeof removeShoppingListCartItemInputSchema>;

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

export function parseCreateShoppingListInput(input: unknown) {
  return parseWithSchema(input, createShoppingListInputSchema);
}

export function parseShoppingListIdInput(input: unknown) {
  return parseWithSchema(input, shoppingListIdInputSchema);
}

export function parseShoppingListStatusInput(input: unknown) {
  return parseWithSchema(input, shoppingListStatusInputSchema);
}

export function parseShoppingListStoreProductsQueryInput(input: unknown) {
  return parseWithSchema(input, shoppingListStoreProductsQuerySchema);
}

export function parseUpsertShoppingListCartItemInput(input: unknown) {
  return parseWithSchema(input, upsertShoppingListCartItemInputSchema);
}

export function parseRemoveShoppingListCartItemInput(input: unknown) {
  return parseWithSchema(input, removeShoppingListCartItemInputSchema);
}
