import { eq } from 'drizzle-orm';
import * as z from 'zod';

import { db } from '../client';
import { prices, products, recentScans, shoppingListItems, shoppingLists, stores } from '../schema';

const backupPayloadSchema = z.object({
  version: z.literal(1),
  exportedAt: z.string(),
  data: z.object({
    stores: z.array(
      z.object({
        id: z.number().int(),
        name: z.string(),
        isActive: z.boolean(),
        createdAt: z.number().int(),
        updatedAt: z.number().int(),
      })
    ),
    products: z.array(
      z.object({
        barcode: z.string(),
        name: z.string().nullable(),
        isActive: z.boolean(),
        createdAt: z.number().int(),
        updatedAt: z.number().int(),
      })
    ),
    prices: z.array(
      z.object({
        id: z.number().int(),
        storeId: z.number().int(),
        productBarcode: z.string(),
        priceCents: z.number().int(),
        capturedAt: z.number().int(),
        createdAt: z.number().int(),
        updatedAt: z.number().int(),
      })
    ),
    recentScans: z.array(
      z.object({
        id: z.number().int(),
        barcode: z.string(),
        scannedAt: z.number().int(),
        source: z.string(),
      })
    ),
    shoppingLists: z.array(
      z.object({
        id: z.number().int(),
        storeId: z.number().int().nullable(),
        status: z.enum(['active', 'done']),
        createdAt: z.number().int(),
        updatedAt: z.number().int(),
      })
    ),
    shoppingListItems: z.array(
      z.object({
        id: z.number().int(),
        shoppingListId: z.number().int(),
        productBarcode: z.string(),
        productName: z.string().nullable(),
        priceCents: z.number().int().nullable(),
        quantity: z.number().int(),
        isChecked: z.boolean(),
        createdAt: z.number().int(),
        updatedAt: z.number().int(),
      })
    ),
  }),
});

export type BackupPayload = z.infer<typeof backupPayloadSchema>;

export type ImportSummary = {
  inserted: {
    stores: number;
    products: number;
    prices: number;
    recentScans: number;
    shoppingLists: number;
    shoppingListItems: number;
  };
  skipped: {
    stores: number;
    products: number;
    prices: number;
    recentScans: number;
    shoppingLists: number;
    shoppingListItems: number;
  };
};

function createEmptySummary(): ImportSummary {
  return {
    inserted: {
      stores: 0,
      products: 0,
      prices: 0,
      recentScans: 0,
      shoppingLists: 0,
      shoppingListItems: 0,
    },
    skipped: {
      stores: 0,
      products: 0,
      prices: 0,
      recentScans: 0,
      shoppingLists: 0,
      shoppingListItems: 0,
    },
  };
}

export async function exportBackupPayload(): Promise<BackupPayload> {
  const [
    storeRows,
    productRows,
    priceRows,
    recentScanRows,
    shoppingListRows,
    shoppingListItemRows,
  ] = await Promise.all([
    db.select().from(stores),
    db.select().from(products),
    db.select().from(prices),
    db.select().from(recentScans),
    db.select().from(shoppingLists),
    db.select().from(shoppingListItems),
  ]);

  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    data: {
      stores: storeRows.map((row) => ({
        id: row.id,
        name: row.name,
        isActive: row.isActive,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      })),
      products: productRows.map((row) => ({
        barcode: row.barcode,
        name: row.name,
        isActive: row.isActive,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      })),
      prices: priceRows.map((row) => ({
        id: row.id,
        storeId: row.storeId,
        productBarcode: row.productBarcode,
        priceCents: row.priceCents,
        capturedAt: row.capturedAt,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      })),
      recentScans: recentScanRows.map((row) => ({
        id: row.id,
        barcode: row.barcode,
        scannedAt: row.scannedAt,
        source: row.source,
      })),
      shoppingLists: shoppingListRows.map((row) => ({
        id: row.id,
        storeId: row.storeId,
        status: row.status,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      })),
      shoppingListItems: shoppingListItemRows.map((row) => ({
        id: row.id,
        shoppingListId: row.shoppingListId,
        productBarcode: row.productBarcode,
        productName: row.productName,
        priceCents: row.priceCents,
        quantity: row.quantity,
        isChecked: row.isChecked,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      })),
    },
  };
}

export async function exportBackupJson(): Promise<string> {
  const payload = await exportBackupPayload();
  return JSON.stringify(payload, null, 2);
}

export async function importBackupJson(jsonText: string): Promise<ImportSummary> {
  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonText);
  } catch {
    throw new Error('Import file is not valid JSON.');
  }

  const payload = backupPayloadSchema.parse(parsed);
  const summary = createEmptySummary();

  await db.transaction(async (tx) => {
    for (const store of payload.data.stores) {
      const existing = await tx
        .select({ id: stores.id })
        .from(stores)
        .where(eq(stores.id, store.id))
        .limit(1);
      if (existing[0]) {
        summary.skipped.stores += 1;
        continue;
      }

      await tx.insert(stores).values({
        id: store.id,
        name: store.name,
        isActive: store.isActive,
        createdAt: store.createdAt,
        updatedAt: store.updatedAt,
      });
      summary.inserted.stores += 1;
    }

    for (const product of payload.data.products) {
      const existing = await tx
        .select({ barcode: products.barcode })
        .from(products)
        .where(eq(products.barcode, product.barcode))
        .limit(1);
      if (existing[0]) {
        summary.skipped.products += 1;
        continue;
      }

      await tx.insert(products).values({
        barcode: product.barcode,
        name: product.name,
        isActive: product.isActive,
        createdAt: product.createdAt,
        updatedAt: product.updatedAt,
      });
      summary.inserted.products += 1;
    }

    for (const shoppingList of payload.data.shoppingLists) {
      const existing = await tx
        .select({ id: shoppingLists.id })
        .from(shoppingLists)
        .where(eq(shoppingLists.id, shoppingList.id))
        .limit(1);
      if (existing[0]) {
        summary.skipped.shoppingLists += 1;
        continue;
      }

      if (shoppingList.storeId != null) {
        const storeExists = await tx
          .select({ id: stores.id })
          .from(stores)
          .where(eq(stores.id, shoppingList.storeId))
          .limit(1);
        if (!storeExists[0]) {
          summary.skipped.shoppingLists += 1;
          continue;
        }
      }

      await tx.insert(shoppingLists).values({
        id: shoppingList.id,
        storeId: shoppingList.storeId,
        status: shoppingList.status,
        createdAt: shoppingList.createdAt,
        updatedAt: shoppingList.updatedAt,
      });
      summary.inserted.shoppingLists += 1;
    }

    for (const price of payload.data.prices) {
      const existingById = await tx
        .select({ id: prices.id })
        .from(prices)
        .where(eq(prices.id, price.id))
        .limit(1);
      if (existingById[0]) {
        summary.skipped.prices += 1;
        continue;
      }

      const storeExists = await tx
        .select({ id: stores.id })
        .from(stores)
        .where(eq(stores.id, price.storeId))
        .limit(1);
      const productExists = await tx
        .select({ barcode: products.barcode })
        .from(products)
        .where(eq(products.barcode, price.productBarcode))
        .limit(1);

      if (!storeExists[0] || !productExists[0]) {
        summary.skipped.prices += 1;
        continue;
      }

      await tx.insert(prices).values({
        id: price.id,
        storeId: price.storeId,
        productBarcode: price.productBarcode,
        priceCents: price.priceCents,
        capturedAt: price.capturedAt,
        createdAt: price.createdAt,
        updatedAt: price.updatedAt,
      });
      summary.inserted.prices += 1;
    }

    for (const recent of payload.data.recentScans) {
      const existing = await tx
        .select({ id: recentScans.id })
        .from(recentScans)
        .where(eq(recentScans.id, recent.id))
        .limit(1);
      if (existing[0]) {
        summary.skipped.recentScans += 1;
        continue;
      }

      await tx.insert(recentScans).values({
        id: recent.id,
        barcode: recent.barcode,
        scannedAt: recent.scannedAt,
        source: recent.source,
      });
      summary.inserted.recentScans += 1;
    }

    for (const item of payload.data.shoppingListItems) {
      const existingById = await tx
        .select({ id: shoppingListItems.id })
        .from(shoppingListItems)
        .where(eq(shoppingListItems.id, item.id))
        .limit(1);
      if (existingById[0]) {
        summary.skipped.shoppingListItems += 1;
        continue;
      }

      const listExists = await tx
        .select({ id: shoppingLists.id })
        .from(shoppingLists)
        .where(eq(shoppingLists.id, item.shoppingListId))
        .limit(1);
      const productExists = await tx
        .select({ barcode: products.barcode })
        .from(products)
        .where(eq(products.barcode, item.productBarcode))
        .limit(1);

      if (!listExists[0] || !productExists[0]) {
        summary.skipped.shoppingListItems += 1;
        continue;
      }

      await tx.insert(shoppingListItems).values({
        id: item.id,
        shoppingListId: item.shoppingListId,
        productBarcode: item.productBarcode,
        productName: item.productName,
        priceCents: item.priceCents,
        quantity: item.quantity,
        isChecked: item.isChecked,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
      });
      summary.inserted.shoppingListItems += 1;
    }
  });

  return summary;
}
