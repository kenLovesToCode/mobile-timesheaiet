import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

import { products } from './products';

export const shoppingListItems = sqliteTable('shopping_list_items', {
  productBarcode: text('product_barcode')
    .notNull()
    .references(() => products.barcode)
    .primaryKey(),
  productName: text('product_name'),
  quantity: integer('quantity').notNull().default(1),
  isChecked: integer('is_checked', { mode: 'boolean' }).notNull().default(false),
  createdAt: integer('created_at').notNull(),
  updatedAt: integer('updated_at').notNull(),
});
