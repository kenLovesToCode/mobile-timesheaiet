import { index, integer, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';

import { products } from './products';
import { stores } from './stores';

export const prices = sqliteTable(
  'prices',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    storeId: integer('store_id')
      .notNull()
      .references(() => stores.id),
    productBarcode: text('product_barcode')
      .notNull()
      .references(() => products.barcode),
    priceCents: integer('price_cents').notNull(),
    capturedAt: integer('captured_at').notNull(),
    createdAt: integer('created_at').notNull(),
    updatedAt: integer('updated_at').notNull(),
  },
  (table) => ({
    storeProductUnique: uniqueIndex('prices_store_id_product_barcode_unique').on(
      table.storeId,
      table.productBarcode
    ),
    productBarcodeIdx: index('prices_product_barcode_idx').on(table.productBarcode),
    storeIdIdx: index('prices_store_id_idx').on(table.storeId),
  })
);
