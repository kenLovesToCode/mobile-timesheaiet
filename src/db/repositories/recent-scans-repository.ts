import { desc, eq, inArray } from 'drizzle-orm';

import { recentScans } from '../schema';
import { normalizeBarcodeValue } from '../../features/scan/scan-barcode';

export type RecentScanRecord = {
  id: number;
  barcode: string;
  scannedAt: number;
  source: string;
};

type RecentScanRow = typeof recentScans.$inferSelect;
type DbClient = typeof import('../client').db;

const DEFAULT_LIMIT = 5;
const MAX_LIMIT = 20;

function mapRecentScanRow(row: RecentScanRow): RecentScanRecord {
  return {
    id: row.id,
    barcode: row.barcode,
    scannedAt: row.scannedAt,
    source: row.source,
  };
}

async function getDb(): Promise<DbClient> {
  // Lazy-load the db client to keep Jest from pulling native SQLite dependencies.
  const { db } = await import('../client');
  return db;
}

async function pruneRecentScans(limit = MAX_LIMIT): Promise<void> {
  const clampedLimit = clampLimit(limit);
  const db = await getDb();
  const rows = await db
    .select({ id: recentScans.id })
    .from(recentScans)
    .orderBy(desc(recentScans.scannedAt), desc(recentScans.id));

  if (rows.length <= clampedLimit) {
    return;
  }

  const idsToDelete = rows.slice(clampedLimit).map((row) => row.id);
  if (!idsToDelete.length) {
    return;
  }

  await db.delete(recentScans).where(inArray(recentScans.id, idsToDelete));
}

function clampLimit(value?: number): number {
  if (!value || !Number.isFinite(value)) {
    return DEFAULT_LIMIT;
  }

  return Math.min(Math.max(1, Math.floor(value)), MAX_LIMIT);
}

export async function recordRecentScan(input: {
  barcode: string;
  source: string;
  scannedAt?: number;
}): Promise<RecentScanRecord | null> {
  const barcode = normalizeBarcodeValue(input.barcode);
  if (!barcode) {
    return null;
  }

  const now = input.scannedAt ?? Date.now();
  const source = input.source.trim() || 'scan';
  const db = await getDb();

  await db.delete(recentScans).where(eq(recentScans.barcode, barcode));
  const result = await db
    .insert(recentScans)
    .values({
      barcode,
      scannedAt: now,
      source,
    })
    .returning();

  const created = result[0];
  await pruneRecentScans(MAX_LIMIT);
  return created ? mapRecentScanRow(created) : null;
}

export async function listRecentScans(limit?: number): Promise<RecentScanRecord[]> {
  const db = await getDb();
  const rows = await db
    .select()
    .from(recentScans)
    .orderBy(desc(recentScans.scannedAt), desc(recentScans.id))
    .limit(clampLimit(limit));

  return rows.map(mapRecentScanRow);
}

export async function listRecentScanBarcodes(limit?: number): Promise<string[]> {
  const db = await getDb();
  const rows = await db
    .select({ barcode: recentScans.barcode })
    .from(recentScans)
    .orderBy(desc(recentScans.scannedAt), desc(recentScans.id))
    .limit(clampLimit(limit));

  return rows.map((row) => row.barcode);
}

export async function deleteRecentScansForBarcodes(barcodes: string[]): Promise<void> {
  if (!barcodes.length) {
    return;
  }

  const db = await getDb();
  await db.delete(recentScans).where(inArray(recentScans.barcode, barcodes));
}

export async function getRecentScanByBarcode(barcode: string): Promise<RecentScanRecord | null> {
  const normalized = normalizeBarcodeValue(barcode);
  if (!normalized) {
    return null;
  }

  const db = await getDb();
  const rows = await db
    .select()
    .from(recentScans)
    .where(eq(recentScans.barcode, normalized))
    .limit(1);
  const row = rows[0];
  return row ? mapRecentScanRow(row) : null;
}
