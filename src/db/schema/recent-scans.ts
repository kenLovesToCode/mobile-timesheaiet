import { index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const recentScans = sqliteTable(
  'recent_scans',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    barcode: text('barcode').notNull(),
    scannedAt: integer('scanned_at').notNull(),
    source: text('source').notNull(),
  },
  (table) => ({
    scannedAtIdx: index('recent_scans_scanned_at_idx').on(table.scannedAt),
    barcodeIdx: index('recent_scans_barcode_idx').on(table.barcode),
  })
);
