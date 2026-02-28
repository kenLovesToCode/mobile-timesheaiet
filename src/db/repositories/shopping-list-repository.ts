import { and, asc, desc, eq, like, sql } from 'drizzle-orm';

import { prices, products, shoppingListItems, shoppingLists, stores } from '../schema';
import {
  parseAddOrIncrementShoppingListItemInput,
  parseAddOrUpdateShoppingListItemInput,
  parseCreateShoppingListInput,
  parseRemoveShoppingListCartItemInput,
  parseShoppingListIdInput,
  parseShoppingListItemLookupInput,
  parseShoppingListItemQuantityInput,
  parseShoppingListItemToggleInput,
  parseShoppingListStatusInput,
  parseShoppingListStoreProductsQueryInput,
  parseUpsertShoppingListCartItemInput,
  SHOPPING_LIST_QUANTITY_MAX,
} from '../validation/shopping-list';

type ShoppingListItemRow = typeof shoppingListItems.$inferSelect;
type ProductRow = typeof products.$inferSelect;
type ShoppingListStatus = 'active' | 'done';
type DbClient = typeof import('../client').db;

export type ShoppingListItemRecord = {
  barcode: string;
  productName: string | null;
  quantity: number;
  isChecked: boolean;
  createdAt: number;
  updatedAt: number;
};

export type ShoppingListSummaryRecord = {
  id: number;
  storeId: number | null;
  storeName: string | null;
  createdAt: number;
  updatedAt: number;
  status: ShoppingListStatus;
  totalAmountCents: number;
};

export type ShoppingListDetailRecord = {
  id: number;
  storeId: number | null;
  storeName: string | null;
  createdAt: number;
  updatedAt: number;
  status: ShoppingListStatus;
};

export type ShoppingStoreProductRecord = {
  barcode: string;
  productName: string;
  priceCents: number;
};

export type ShoppingCartItemRecord = {
  barcode: string;
  productName: string;
  priceCents: number;
  quantity: number;
  amountCents: number;
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

async function getOrCreateDefaultActiveShoppingListId(db: DbClient): Promise<number> {
  const activeRows = await db
    .select({ id: shoppingLists.id })
    .from(shoppingLists)
    .where(eq(shoppingLists.status, 'active'))
    .orderBy(desc(shoppingLists.updatedAt), desc(shoppingLists.id))
    .limit(1);

  const active = activeRows[0];
  if (active) {
    return active.id;
  }

  const now = Date.now();
  const storeRows = await db
    .select({ id: stores.id })
    .from(stores)
    .where(eq(stores.isActive, true))
    .orderBy(asc(stores.id))
    .limit(1);

  const result = await db
    .insert(shoppingLists)
    .values({
      storeId: storeRows[0]?.id ?? null,
      status: 'active',
      createdAt: now,
      updatedAt: now,
    })
    .returning({ id: shoppingLists.id });

  const created = result[0];
  if (!created) {
    throw new Error('Failed to create default shopping list');
  }

  return created.id;
}

export async function listShoppingLists(): Promise<ShoppingListSummaryRecord[]> {
  const db = getDb();
  const rows = await db
    .select({
      id: shoppingLists.id,
      storeId: shoppingLists.storeId,
      storeName: stores.name,
      createdAt: shoppingLists.createdAt,
      updatedAt: shoppingLists.updatedAt,
      status: shoppingLists.status,
      totalAmountCents: sql<number>`coalesce(sum(coalesce(${shoppingListItems.priceCents}, ${prices.priceCents}, 0) * ${shoppingListItems.quantity}), 0)`,
    })
    .from(shoppingLists)
    .leftJoin(stores, eq(shoppingLists.storeId, stores.id))
    .leftJoin(shoppingListItems, eq(shoppingListItems.shoppingListId, shoppingLists.id))
    .leftJoin(
      prices,
      and(
        eq(prices.storeId, shoppingLists.storeId),
        eq(prices.productBarcode, shoppingListItems.productBarcode)
      )
    )
    .groupBy(
      shoppingLists.id,
      shoppingLists.storeId,
      stores.name,
      shoppingLists.createdAt,
      shoppingLists.updatedAt,
      shoppingLists.status
    )
    .orderBy(desc(shoppingLists.updatedAt), desc(shoppingLists.id));

  return rows.map((row) => ({
    id: row.id,
    storeId: row.storeId ?? null,
    storeName: row.storeName ?? null,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    status: row.status,
    totalAmountCents: Number(row.totalAmountCents ?? 0),
  }));
}

export async function createShoppingList(input: unknown): Promise<ShoppingListDetailRecord> {
  const payload = parseCreateShoppingListInput(input);
  const now = Date.now();
  const db = getDb();

  const result = await db
    .insert(shoppingLists)
    .values({
      storeId: payload.storeId,
      status: 'active',
      createdAt: now,
      updatedAt: now,
    })
    .returning();

  const created = result[0];
  if (!created) {
    throw new Error('Failed to create shopping list');
  }

  const storeRow = await db
    .select({ name: stores.name })
    .from(stores)
    .where(eq(stores.id, created.storeId ?? -1))
    .limit(1);

  return {
    id: created.id,
    storeId: created.storeId ?? null,
    storeName: storeRow[0]?.name ?? null,
    createdAt: created.createdAt,
    updatedAt: created.updatedAt,
    status: created.status,
  };
}

export async function getShoppingListById(input: unknown): Promise<ShoppingListDetailRecord | null> {
  const payload = parseShoppingListIdInput(input);
  const db = getDb();

  const rows = await db
    .select({
      id: shoppingLists.id,
      storeId: shoppingLists.storeId,
      storeName: stores.name,
      createdAt: shoppingLists.createdAt,
      updatedAt: shoppingLists.updatedAt,
      status: shoppingLists.status,
    })
    .from(shoppingLists)
    .leftJoin(stores, eq(shoppingLists.storeId, stores.id))
    .where(eq(shoppingLists.id, payload.shoppingListId))
    .limit(1);

  const row = rows[0];
  if (!row) {
    return null;
  }

  return {
    id: row.id,
    storeId: row.storeId ?? null,
    storeName: row.storeName ?? null,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    status: row.status,
  };
}

export async function setShoppingListStatus(input: unknown): Promise<ShoppingListDetailRecord> {
  const payload = parseShoppingListStatusInput(input);
  const now = Date.now();
  const db = getDb();

  const result = await db
    .update(shoppingLists)
    .set({ status: payload.status, updatedAt: now })
    .where(eq(shoppingLists.id, payload.shoppingListId))
    .returning();

  const updated = result[0];
  if (!updated) {
    throw new Error('Shopping list not found');
  }

  const storeRow = await db
    .select({ name: stores.name })
    .from(stores)
    .where(eq(stores.id, updated.storeId ?? -1))
    .limit(1);

  return {
    id: updated.id,
    storeId: updated.storeId ?? null,
    storeName: storeRow[0]?.name ?? null,
    createdAt: updated.createdAt,
    updatedAt: updated.updatedAt,
    status: updated.status,
  };
}

export async function listStoreProductsForShopping(
  input: unknown
): Promise<ShoppingStoreProductRecord[]> {
  const payload = parseShoppingListStoreProductsQueryInput(input);
  const db = getDb();

  const listRows = await db
    .select({ storeId: shoppingLists.storeId })
    .from(shoppingLists)
    .where(eq(shoppingLists.id, payload.shoppingListId))
    .limit(1);

  const storeId = listRows[0]?.storeId;
  if (!storeId) {
    return [];
  }

  const trimmedQuery = payload.query?.trim();
  const shouldFilter = Boolean(trimmedQuery);
  const normalizedQuery = `%${trimmedQuery?.toLowerCase() ?? ''}%`;

  const whereClause = shouldFilter
    ? and(
        eq(prices.storeId, storeId),
        like(sql`lower(coalesce(${products.name}, ''))`, normalizedQuery)
      )
    : eq(prices.storeId, storeId);

  const rows = await db
    .select({
      barcode: prices.productBarcode,
      productName: sql<string>`coalesce(${products.name}, ${prices.productBarcode})`,
      priceCents: prices.priceCents,
    })
    .from(prices)
    .leftJoin(products, eq(prices.productBarcode, products.barcode))
    .where(whereClause)
    .orderBy(asc(sql`lower(coalesce(${products.name}, ${prices.productBarcode}))`), asc(prices.id));

  return rows.map((row) => ({
    barcode: row.barcode,
    productName: row.productName,
    priceCents: row.priceCents,
  }));
}

export async function listShoppingListCartItems(
  input: unknown
): Promise<ShoppingCartItemRecord[]> {
  const payload = parseShoppingListIdInput(input);
  const db = getDb();

  const rows = await db
    .select({
      barcode: shoppingListItems.productBarcode,
      productName: sql<string>`coalesce(${products.name}, ${shoppingListItems.productName}, ${shoppingListItems.productBarcode})`,
      priceCents: sql<number>`coalesce(${shoppingListItems.priceCents}, ${prices.priceCents}, 0)`,
      quantity: shoppingListItems.quantity,
      createdAt: shoppingListItems.createdAt,
      updatedAt: shoppingListItems.updatedAt,
    })
    .from(shoppingListItems)
    .leftJoin(shoppingLists, eq(shoppingLists.id, shoppingListItems.shoppingListId))
    .leftJoin(products, eq(shoppingListItems.productBarcode, products.barcode))
    .leftJoin(
      prices,
      and(
        eq(prices.storeId, shoppingLists.storeId),
        eq(prices.productBarcode, shoppingListItems.productBarcode)
      )
    )
    .where(eq(shoppingListItems.shoppingListId, payload.shoppingListId))
    .orderBy(asc(shoppingListItems.createdAt), asc(shoppingListItems.productBarcode));

  return rows.map((row) => ({
    barcode: row.barcode,
    productName: row.productName,
    priceCents: Number(row.priceCents ?? 0),
    quantity: row.quantity,
    amountCents: Number(row.priceCents ?? 0) * row.quantity,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  }));
}

export async function upsertShoppingListCartItem(
  input: unknown
): Promise<ShoppingCartItemRecord> {
  const payload = parseUpsertShoppingListCartItemInput(input);
  const now = Date.now();
  const db = getDb();

  const productRows = await db
    .select()
    .from(products)
    .where(eq(products.barcode, payload.barcode))
    .limit(1);
  const productRow = productRows[0];

  const normalizedProductName = payload.productName?.trim() || productRow?.name || null;

  if (!productRow) {
    await db.insert(products).values({
      barcode: payload.barcode,
      name: normalizedProductName,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });
  } else if (normalizedProductName && normalizedProductName !== productRow.name) {
    await db
      .update(products)
      .set({ name: normalizedProductName, updatedAt: now, isActive: true })
      .where(eq(products.barcode, payload.barcode));
  }

  const result = await db
    .insert(shoppingListItems)
    .values({
      shoppingListId: payload.shoppingListId,
      productBarcode: payload.barcode,
      productName: normalizedProductName,
      priceCents: payload.priceCents ?? null,
      quantity: payload.quantity,
      isChecked: false,
      createdAt: now,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: [shoppingListItems.shoppingListId, shoppingListItems.productBarcode],
      set: {
        quantity: payload.quantity,
        priceCents: payload.priceCents ?? null,
        updatedAt: now,
        ...(normalizedProductName ? { productName: normalizedProductName } : {}),
      },
    })
    .returning();

  const saved = result[0];
  if (!saved) {
    throw new Error('Failed to save shopping cart item');
  }

  const resolvedName = normalizedProductName ?? payload.barcode;

  return {
    barcode: saved.productBarcode,
    productName: resolvedName,
    priceCents: saved.priceCents ?? 0,
    quantity: saved.quantity,
    amountCents: (saved.priceCents ?? 0) * saved.quantity,
    createdAt: saved.createdAt,
    updatedAt: saved.updatedAt,
  };
}

export async function updateShoppingListCartItemQuantity(
  input: unknown
): Promise<ShoppingCartItemRecord> {
  const payload = parseUpsertShoppingListCartItemInput(input);
  const now = Date.now();
  const db = getDb();

  const result = await db
    .update(shoppingListItems)
    .set({
      quantity: payload.quantity,
      updatedAt: now,
      ...(payload.priceCents != null ? { priceCents: payload.priceCents } : {}),
    })
    .where(
      and(
        eq(shoppingListItems.shoppingListId, payload.shoppingListId),
        eq(shoppingListItems.productBarcode, payload.barcode)
      )
    )
    .returning();

  const updated = result[0];
  if (!updated) {
    throw new Error('Shopping cart item not found');
  }

  return {
    barcode: updated.productBarcode,
    productName: updated.productName ?? updated.productBarcode,
    priceCents: updated.priceCents ?? 0,
    quantity: updated.quantity,
    amountCents: (updated.priceCents ?? 0) * updated.quantity,
    createdAt: updated.createdAt,
    updatedAt: updated.updatedAt,
  };
}

export async function removeShoppingListCartItem(input: unknown): Promise<void> {
  const payload = parseRemoveShoppingListCartItemInput(input);
  const db = getDb();

  await db
    .delete(shoppingListItems)
    .where(
      and(
        eq(shoppingListItems.shoppingListId, payload.shoppingListId),
        eq(shoppingListItems.productBarcode, payload.barcode)
      )
    );
}

export async function addOrUpdateShoppingListItem(
  input: unknown
): Promise<ShoppingListItemRecord> {
  const payload = parseAddOrUpdateShoppingListItemInput(input);
  const db = getDb();
  const shoppingListId = await getOrCreateDefaultActiveShoppingListId(db);

  const cartItem = await upsertShoppingListCartItem({
    shoppingListId,
    barcode: payload.barcode,
    quantity: payload.quantity,
    productName: payload.productName,
  });

  const rows = await db
    .select()
    .from(shoppingListItems)
    .where(
      and(
        eq(shoppingListItems.shoppingListId, shoppingListId),
        eq(shoppingListItems.productBarcode, payload.barcode)
      )
    )
    .limit(1);

  const row = rows[0];
  if (!row) {
    throw new Error('Failed to save shopping list item');
  }

  const productRows = await db
    .select()
    .from(products)
    .where(eq(products.barcode, cartItem.barcode))
    .limit(1);

  return mapShoppingListItemRow(row, productRows[0]);
}

export async function addOrIncrementShoppingListItem(
  input: unknown
): Promise<ShoppingListItemRecord> {
  const payload = parseAddOrIncrementShoppingListItemInput(input);
  const now = Date.now();
  const db = getDb();
  const shoppingListId = await getOrCreateDefaultActiveShoppingListId(db);

  const existingRows = await db
    .select()
    .from(shoppingListItems)
    .where(
      and(
        eq(shoppingListItems.shoppingListId, shoppingListId),
        eq(shoppingListItems.productBarcode, payload.barcode)
      )
    )
    .limit(1);

  const existing = existingRows[0];
  const nextQuantity = Math.min(
    SHOPPING_LIST_QUANTITY_MAX,
    (existing?.quantity ?? 0) + payload.quantity
  );

  await upsertShoppingListCartItem({
    shoppingListId,
    barcode: payload.barcode,
    quantity: nextQuantity,
    productName: payload.productName,
    priceCents: existing?.priceCents ?? null,
  });

  const updatedRows = await db
    .select()
    .from(shoppingListItems)
    .where(
      and(
        eq(shoppingListItems.shoppingListId, shoppingListId),
        eq(shoppingListItems.productBarcode, payload.barcode)
      )
    )
    .limit(1);

  const updated = updatedRows[0];
  if (!updated) {
    throw new Error('Failed to save shopping list item');
  }

  const productRows = await db
    .select()
    .from(products)
    .where(eq(products.barcode, payload.barcode))
    .limit(1);

  // Keep updatedAt semantics aligned with legacy behavior for callers that inspect this field.
  const mergedRow = { ...updated, updatedAt: now };
  return mapShoppingListItemRow(mergedRow, productRows[0]);
}

export async function listShoppingListItems(): Promise<ShoppingListItemRecord[]> {
  const db = getDb();
  const shoppingListId = await getOrCreateDefaultActiveShoppingListId(db);

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
    .where(eq(shoppingListItems.shoppingListId, shoppingListId))
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
  const shoppingListId = await getOrCreateDefaultActiveShoppingListId(db);

  const result = await db
    .update(shoppingListItems)
    .set({ quantity: payload.quantity, updatedAt: now })
    .where(
      and(
        eq(shoppingListItems.shoppingListId, shoppingListId),
        eq(shoppingListItems.productBarcode, payload.barcode)
      )
    )
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
  const shoppingListId = await getOrCreateDefaultActiveShoppingListId(db);

  const result = await db
    .update(shoppingListItems)
    .set({ isChecked: payload.isChecked, updatedAt: now })
    .where(
      and(
        eq(shoppingListItems.shoppingListId, shoppingListId),
        eq(shoppingListItems.productBarcode, payload.barcode)
      )
    )
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
  const shoppingListId = await getOrCreateDefaultActiveShoppingListId(db);

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
    .where(
      and(
        eq(shoppingListItems.shoppingListId, shoppingListId),
        eq(shoppingListItems.productBarcode, payload.barcode)
      )
    )
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
