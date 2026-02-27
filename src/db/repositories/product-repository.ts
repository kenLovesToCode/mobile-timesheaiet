import { and, asc, eq, like, or, sql } from 'drizzle-orm';

import { db } from '../client';
import { products } from '../schema';
import {
  parseCreateProductInput,
  parseListProductsInput,
  parseSetProductActiveInput,
  parseUpdateProductNameInput,
  ProductValidationError,
} from '../validation/products';

type ProductRow = typeof products.$inferSelect;

export type ProductListItem = {
  barcode: string;
  name: string | null;
  isActive: boolean;
  createdAt: number;
  updatedAt: number;
};

function mapProductRow(row: ProductRow): ProductListItem {
  return {
    barcode: row.barcode,
    name: row.name,
    isActive: row.isActive,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export async function listProducts(input?: unknown): Promise<ProductListItem[]> {
  const payload = parseListProductsInput(input ?? {});
  const hasQuery = payload.query.length > 0;
  const lowerQuery = payload.query.toLowerCase();

  const rows = await db
    .select()
    .from(products)
    .where(
      and(
        payload.includeInactive ? undefined : eq(products.isActive, true),
        hasQuery
          ? or(
              like(sql<string>`lower(coalesce(${products.name}, ''))`, `%${lowerQuery}%`),
              like(products.barcode, `%${payload.query}%`)
            )
          : undefined
      )
    )
    .orderBy(asc(products.name), asc(products.barcode));

  return rows.map(mapProductRow);
}

export async function createProduct(input: unknown): Promise<ProductListItem> {
  const payload = parseCreateProductInput(input);
  const now = Date.now();

  const existingRows = await db
    .select({ barcode: products.barcode })
    .from(products)
    .where(eq(products.barcode, payload.barcode))
    .limit(1);

  if (existingRows[0]) {
    throw new ProductValidationError([
      {
        code: 'custom',
        message: 'product barcode already exists',
        path: ['barcode'],
      },
    ]);
  }

  const result = await db
    .insert(products)
    .values({
      barcode: payload.barcode,
      name: payload.name,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    })
    .returning();

  const created = result[0];

  if (!created) {
    throw new Error('Failed to create product');
  }

  return mapProductRow(created);
}

export async function updateProductName(input: unknown): Promise<ProductListItem> {
  const payload = parseUpdateProductNameInput(input);
  const now = Date.now();

  const result = await db
    .update(products)
    .set({
      name: payload.name,
      updatedAt: now,
    })
    .where(eq(products.barcode, payload.barcode))
    .returning();

  const updated = result[0];

  if (!updated) {
    throw new Error(`Product not found: ${payload.barcode}`);
  }

  return mapProductRow(updated);
}

export async function setProductActive(input: unknown): Promise<ProductListItem> {
  const payload = parseSetProductActiveInput(input);
  const now = Date.now();

  const result = await db
    .update(products)
    .set({
      isActive: payload.isActive,
      updatedAt: now,
    })
    .where(eq(products.barcode, payload.barcode))
    .returning();

  const updated = result[0];

  if (!updated) {
    throw new Error(`Product not found: ${payload.barcode}`);
  }

  return mapProductRow(updated);
}
