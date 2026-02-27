import { asc, eq, sql } from 'drizzle-orm';

import { products, shoppingListItems } from '../schema';
import {
  parseAddOrIncrementShoppingListItemInput,
  parseAddOrUpdateShoppingListItemInput,
  SHOPPING_LIST_QUANTITY_MAX,
  parseShoppingListItemLookupInput,
  parseShoppingListItemQuantityInput,
  parseShoppingListItemToggleInput,
} from '../validation/shopping-list';

type ShoppingListItemRow = typeof shoppingListItems.$inferSelect;
type ProductRow = typeof products.$inferSelect;
type DbClient = typeof import('../client').db;

export type ShoppingListItemRecord = {
  barcode: string;
  productName: string | null;
  quantity: number;
  isChecked: boolean;
  createdAt: number;
  updatedAt: number;
};

function mapShoppingListItemRow(
  row: ShoppingListItemRow,
  product: ProductRow | undefined
): ShoppingListItemRecord {
  return {
    barcode: row.productBarcode,
    productName: product?.name ?? row.productName ?? null,
    quantity: row.quantity,
    isChecked: row.isChecked,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function getDb(): DbClient {
  // Lazy-load the db client to keep Jest from pulling native SQLite dependencies.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { db } = require('../client') as { db: DbClient };
  return db;
}

export async function addOrUpdateShoppingListItem(
  input: unknown
): Promise<ShoppingListItemRecord> {
  const payload = parseAddOrUpdateShoppingListItemInput(input);
  const now = Date.now();
  const normalizedProductName = payload.productName?.trim() || undefined;

  const db = getDb();

  return db.transaction(async (tx) => {
    const productRows = await tx
      .select()
      .from(products)
      .where(eq(products.barcode, payload.barcode))
      .limit(1);
    let productRow = productRows[0];

    if (!productRow) {
      await tx
        .insert(products)
        .values({
          barcode: payload.barcode,
          name: normalizedProductName ?? null,
          createdAt: now,
          updatedAt: now,
        })
        .onConflictDoNothing();
      const productLookup = await tx
        .select()
        .from(products)
        .where(eq(products.barcode, payload.barcode))
        .limit(1);
      productRow = productLookup[0];
    }
    if (normalizedProductName && productRow?.name !== normalizedProductName) {
      await tx
        .update(products)
        .set({ name: normalizedProductName, updatedAt: now })
        .where(eq(products.barcode, payload.barcode));
      productRow = {
        barcode: payload.barcode,
        name: normalizedProductName,
        createdAt: productRow?.createdAt ?? now,
        updatedAt: now,
      };
    }

    const existingRows = await tx
      .select()
      .from(shoppingListItems)
      .where(eq(shoppingListItems.productBarcode, payload.barcode))
      .limit(1);

    const existing = existingRows[0];
    const createdAt = existing?.createdAt ?? now;
    const isChecked = existing?.isChecked ?? false;
    const productName = normalizedProductName ?? existing?.productName ?? null;

    const result = await tx
      .insert(shoppingListItems)
      .values({
        productBarcode: payload.barcode,
        productName,
        quantity: payload.quantity,
        isChecked,
        createdAt,
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: shoppingListItems.productBarcode,
        set: {
          quantity: payload.quantity,
          updatedAt: now,
          ...(normalizedProductName ? { productName: normalizedProductName } : {}),
        },
      })
      .returning();

    const saved = result[0];
    if (!saved) {
      throw new Error('Failed to save shopping list item');
    }

    return mapShoppingListItemRow(saved, productRow);
  });
}

export async function addOrIncrementShoppingListItem(
  input: unknown
): Promise<ShoppingListItemRecord> {
  const payload = parseAddOrIncrementShoppingListItemInput(input);
  const now = Date.now();
  const normalizedProductName = payload.productName?.trim() || undefined;

  const db = getDb();

  return db.transaction(async (tx) => {
    const productRows = await tx
      .select()
      .from(products)
      .where(eq(products.barcode, payload.barcode))
      .limit(1);
    let productRow = productRows[0];

    if (!productRow) {
      await tx
        .insert(products)
        .values({
          barcode: payload.barcode,
          name: normalizedProductName ?? null,
          createdAt: now,
          updatedAt: now,
        })
        .onConflictDoNothing();
      const productLookup = await tx
        .select()
        .from(products)
        .where(eq(products.barcode, payload.barcode))
        .limit(1);
      productRow = productLookup[0];
    }
    if (normalizedProductName && productRow?.name !== normalizedProductName) {
      await tx
        .update(products)
        .set({ name: normalizedProductName, updatedAt: now })
        .where(eq(products.barcode, payload.barcode));
      productRow = {
        barcode: payload.barcode,
        name: normalizedProductName,
        createdAt: productRow?.createdAt ?? now,
        updatedAt: now,
      };
    }

    const result = await tx
      .insert(shoppingListItems)
      .values({
        productBarcode: payload.barcode,
        productName: normalizedProductName ?? null,
        quantity: payload.quantity,
        isChecked: false,
        createdAt: now,
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: shoppingListItems.productBarcode,
        set: {
          quantity: sql<number>`min(${SHOPPING_LIST_QUANTITY_MAX}, ${
            shoppingListItems.quantity
          } + ${payload.quantity})`,
          updatedAt: now,
          ...(normalizedProductName ? { productName: normalizedProductName } : {}),
        },
      })
      .returning();

    const saved = result[0];
    if (!saved) {
      throw new Error('Failed to save shopping list item');
    }

    return mapShoppingListItemRow(saved, productRow);
  });
}

export async function listShoppingListItems(): Promise<ShoppingListItemRecord[]> {
  const db = getDb();
  const rows = await db
    .select({
      productBarcode: shoppingListItems.productBarcode,
      quantity: shoppingListItems.quantity,
      isChecked: shoppingListItems.isChecked,
      createdAt: shoppingListItems.createdAt,
      updatedAt: shoppingListItems.updatedAt,
      productName: sql<string | null>`coalesce(${products.name}, ${shoppingListItems.productName})`,
    })
    .from(shoppingListItems)
    .leftJoin(products, eq(shoppingListItems.productBarcode, products.barcode))
    .orderBy(asc(shoppingListItems.createdAt), asc(shoppingListItems.productBarcode));

  return rows.map((row) => ({
    barcode: row.productBarcode,
    productName: row.productName ?? null,
    quantity: row.quantity,
    isChecked: row.isChecked,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  }));
}

export async function setShoppingListItemQuantity(
  input: unknown
): Promise<ShoppingListItemRecord> {
  const payload = parseShoppingListItemQuantityInput(input);
  const now = Date.now();
  const db = getDb();

  const result = await db
    .update(shoppingListItems)
    .set({ quantity: payload.quantity, updatedAt: now })
    .where(eq(shoppingListItems.productBarcode, payload.barcode))
    .returning();

  const updated = result[0];
  if (!updated) {
    throw new Error('Shopping list item not found');
  }

  const productRows = await db
    .select()
    .from(products)
    .where(eq(products.barcode, payload.barcode))
    .limit(1);

  return mapShoppingListItemRow(updated, productRows[0]);
}

export async function toggleShoppingListItemChecked(
  input: unknown
): Promise<ShoppingListItemRecord> {
  const payload = parseShoppingListItemToggleInput(input);
  const now = Date.now();
  const db = getDb();

  const result = await db
    .update(shoppingListItems)
    .set({ isChecked: payload.isChecked, updatedAt: now })
    .where(eq(shoppingListItems.productBarcode, payload.barcode))
    .returning();

  const updated = result[0];
  if (!updated) {
    throw new Error('Shopping list item not found');
  }

  const productRows = await db
    .select()
    .from(products)
    .where(eq(products.barcode, payload.barcode))
    .limit(1);

  return mapShoppingListItemRow(updated, productRows[0]);
}

export async function getShoppingListItem(
  input: unknown
): Promise<ShoppingListItemRecord | null> {
  const payload = parseShoppingListItemLookupInput(input);

  const db = getDb();
  const rows = await db
    .select({
      productBarcode: shoppingListItems.productBarcode,
      quantity: shoppingListItems.quantity,
      isChecked: shoppingListItems.isChecked,
      createdAt: shoppingListItems.createdAt,
      updatedAt: shoppingListItems.updatedAt,
      productName: sql<string | null>`coalesce(${products.name}, ${shoppingListItems.productName})`,
    })
    .from(shoppingListItems)
    .leftJoin(products, eq(shoppingListItems.productBarcode, products.barcode))
    .where(eq(shoppingListItems.productBarcode, payload.barcode))
    .limit(1);

  const row = rows[0];
  if (!row) {
    return null;
  }

  return {
    barcode: row.productBarcode,
    productName: row.productName ?? null,
    quantity: row.quantity,
    isChecked: row.isChecked,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}
