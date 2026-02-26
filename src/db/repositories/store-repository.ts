import { asc, eq, sql } from 'drizzle-orm';

import { db } from '../client';
import { stores } from '../schema';
import {
  parseCreateStoreInput,
  parseToggleStoreActiveInput,
  parseUpdateStoreNameInput,
} from '../validation/stores';

export type StoreListItem = {
  id: number;
  name: string;
  isActive: boolean;
  createdAt: number;
  updatedAt: number;
};

type StoreRow = typeof stores.$inferSelect;

function mapStoreRow(row: StoreRow): StoreListItem {
  return {
    id: row.id,
    name: row.name,
    isActive: row.isActive,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export async function listStores(): Promise<StoreListItem[]> {
  const rows = await db.select().from(stores).orderBy(asc(stores.name), asc(stores.id));
  return rows.map(mapStoreRow);
}

export async function getStoreById(id: number): Promise<StoreListItem | null> {
  const rows = await db.select().from(stores).where(eq(stores.id, id)).limit(1);
  const row = rows[0];
  return row ? mapStoreRow(row) : null;
}

export async function createStore(input: unknown): Promise<StoreListItem> {
  const payload = parseCreateStoreInput(input);
  const now = Date.now();

  const result = await db
    .insert(stores)
    .values({
      name: payload.name,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    })
    .returning();

  const created = result[0];

  if (!created) {
    throw new Error('Failed to create store');
  }

  return mapStoreRow(created);
}

export async function updateStoreName(input: unknown): Promise<StoreListItem> {
  const payload = parseUpdateStoreNameInput(input);
  const now = Date.now();

  const result = await db
    .update(stores)
    .set({
      name: payload.name,
      updatedAt: now,
    })
    .where(eq(stores.id, payload.id))
    .returning();

  const updated = result[0];

  if (!updated) {
    throw new Error(`Store not found: ${payload.id}`);
  }

  return mapStoreRow(updated);
}

export async function toggleStoreActive(input: unknown): Promise<StoreListItem> {
  const payload = parseToggleStoreActiveInput(input);
  const now = Date.now();

  const result = await db
    .update(stores)
    .set({
      isActive: payload.isActive,
      updatedAt: now,
    })
    .where(eq(stores.id, payload.id))
    .returning();

  const updated = result[0];

  if (!updated) {
    throw new Error(`Store not found: ${payload.id}`);
  }

  return mapStoreRow(updated);
}

export async function getActiveStoreCount(): Promise<number> {
  const rows = await db
    .select({ count: sql<number>`count(*)` })
    .from(stores)
    .where(eq(stores.isActive, true));

  return Number(rows[0]?.count ?? 0);
}
