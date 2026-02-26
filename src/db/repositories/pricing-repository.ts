import { and, asc, eq } from 'drizzle-orm';

import { db } from '../client';
import { prices, products, stores } from '../schema';
import {
  PricingValidationError,
  parseResultsLookupInput,
  parseSaveStorePriceInput,
} from '../validation/pricing';

type ProductRow = typeof products.$inferSelect;
type PriceRow = typeof prices.$inferSelect;

export type ResultsStorePriceRow = {
  storeId: number;
  storeName: string;
  isActive: boolean;
  priceCents: number | null;
  capturedAt: number | null;
  priceUpdatedAt: number | null;
};

export type ResultsLookupRecord = {
  barcode: string;
  productName: string | null;
  stores: ResultsStorePriceRow[];
};

export type ProductLookupRecord = {
  barcode: string;
  name: string | null;
};

export type SaveStorePriceResult = {
  barcode: string;
  productName: string | null;
  storeId: number;
  priceCents: number;
  capturedAt: number;
  updatedAt: number;
};

function normalizeOptionalName(name: string | null | undefined): string | undefined {
  const trimmed = name?.trim();
  return trimmed ? trimmed : undefined;
}

function mapPriceRowToSaveResult(
  row: PriceRow,
  product: ProductRow | undefined
): SaveStorePriceResult {
  return {
    barcode: row.productBarcode,
    productName: product?.name ?? null,
    storeId: row.storeId,
    priceCents: row.priceCents,
    capturedAt: row.capturedAt,
    updatedAt: row.updatedAt,
  };
}

export async function saveStorePrice(input: unknown): Promise<SaveStorePriceResult> {
  const payload = parseSaveStorePriceInput(input);
  const now = Date.now();

  return db.transaction(async (tx) => {
    const existingStoreRows = await tx
      .select({ id: stores.id, isActive: stores.isActive })
      .from(stores)
      .where(eq(stores.id, payload.storeId))
      .limit(1);

    const existingStore = existingStoreRows[0];

    if (!existingStore) {
      throw new PricingValidationError([
        {
          code: 'custom',
          message: 'store does not exist',
          path: ['storeId'],
        },
      ]);
    }

    if (!existingStore.isActive) {
      throw new PricingValidationError([
        {
          code: 'custom',
          message: 'store is inactive',
          path: ['storeId'],
        },
      ]);
    }

    const existingProductRows = await tx
      .select()
      .from(products)
      .where(eq(products.barcode, payload.barcode))
      .limit(1);

    const existingProduct = existingProductRows[0];
    const normalizedName = normalizeOptionalName(payload.productName);
    const existingProductName = normalizeOptionalName(existingProduct?.name ?? null);
    const isProductNameRequired = !existingProduct || !existingProductName;

    if (isProductNameRequired && !normalizedName) {
      throw new PricingValidationError([
        {
          code: 'custom',
          message: 'product name is required when barcode is unknown',
          path: ['productName'],
        },
      ]);
    }

    const productNameToSave = normalizedName ?? existingProductName ?? null;
    const shouldUpdateProductUpdatedAt =
      existingProduct != null && existingProductName !== (productNameToSave ?? null);
    const productUpdatedAtToSave =
      existingProduct != null && !shouldUpdateProductUpdatedAt ? existingProduct.updatedAt : now;

    const existingPriceRows = await tx
      .select()
      .from(prices)
      .where(and(eq(prices.storeId, payload.storeId), eq(prices.productBarcode, payload.barcode)))
      .limit(1);

    const existingPrice = existingPriceRows[0];
    const capturedAtToSave =
      existingPrice && existingPrice.priceCents === payload.priceCents ? existingPrice.capturedAt : now;

    await tx
      .insert(products)
      .values({
        barcode: payload.barcode,
        name: productNameToSave,
        createdAt: now,
        updatedAt: productUpdatedAtToSave,
      })
      .onConflictDoUpdate({
        target: products.barcode,
        set: {
          name: productNameToSave,
          updatedAt: productUpdatedAtToSave,
        },
      });

    const priceResult = await tx
      .insert(prices)
      .values({
        storeId: payload.storeId,
        productBarcode: payload.barcode,
        priceCents: payload.priceCents,
        capturedAt: capturedAtToSave,
        createdAt: now,
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: [prices.storeId, prices.productBarcode],
        set: {
          priceCents: payload.priceCents,
          capturedAt: capturedAtToSave,
          updatedAt: now,
        },
      })
      .returning();

    const savedPrice = priceResult[0];

    if (!savedPrice) {
      throw new Error('Failed to save price');
    }

    const savedProductRows = await tx
      .select()
      .from(products)
      .where(eq(products.barcode, payload.barcode))
      .limit(1);

    return mapPriceRowToSaveResult(savedPrice, savedProductRows[0]);
  });
}

export async function getResultsByBarcodeAcrossActiveStores(
  input: unknown
): Promise<ResultsLookupRecord> {
  const payload = parseResultsLookupInput(input);

  const [productRows, rows] = await Promise.all([
    db.select().from(products).where(eq(products.barcode, payload.barcode)).limit(1),
    db
      .select({
        storeId: stores.id,
        storeName: stores.name,
        isActive: stores.isActive,
        priceCents: prices.priceCents,
        capturedAt: prices.capturedAt,
        priceUpdatedAt: prices.updatedAt,
      })
      .from(stores)
      .leftJoin(
        prices,
        and(eq(prices.storeId, stores.id), eq(prices.productBarcode, payload.barcode))
      )
      .where(eq(stores.isActive, true))
      .orderBy(asc(stores.name), asc(stores.id)),
  ]);

  return {
    barcode: payload.barcode,
    productName: productRows[0]?.name ?? null,
    stores: rows.map((row) => ({
      storeId: row.storeId,
      storeName: row.storeName,
      isActive: row.isActive,
      priceCents: row.priceCents ?? null,
      capturedAt: row.capturedAt ?? null,
      priceUpdatedAt: row.priceUpdatedAt ?? null,
    })),
  };
}

export async function getProductByBarcode(input: unknown): Promise<ProductLookupRecord | null> {
  const payload = parseResultsLookupInput(input);

  const productRows = await db
    .select({
      barcode: products.barcode,
      name: products.name,
    })
    .from(products)
    .where(eq(products.barcode, payload.barcode))
    .limit(1);

  return productRows[0] ?? null;
}
