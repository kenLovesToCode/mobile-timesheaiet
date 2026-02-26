import { index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const products = sqliteTable(
  'products',
  {
    barcode: text('barcode').primaryKey(),
    name: text('name'),
    createdAt: integer('created_at').notNull(),
    updatedAt: integer('updated_at').notNull(),
  },
  (table) => ({
    nameIdx: index('products_name_idx').on(table.name),
  })
);
