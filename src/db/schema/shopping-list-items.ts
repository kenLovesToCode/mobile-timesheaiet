import { index, integer, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';

import { products } from './products';
import { shoppingLists } from './shopping-lists';

export const shoppingListItems = sqliteTable(
  'shopping_list_items',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    shoppingListId: integer('shopping_list_id')
      .notNull()
      .references(() => shoppingLists.id),
    productBarcode: text('product_barcode')
      .notNull()
      .references(() => products.barcode),
    productName: text('product_name'),
    priceCents: integer('price_cents'),
    quantity: integer('quantity').notNull().default(1),
    isChecked: integer('is_checked', { mode: 'boolean' }).notNull().default(false),
    createdAt: integer('created_at').notNull(),
    updatedAt: integer('updated_at').notNull(),
  },
  (table) => ({
    listProductUnique: uniqueIndex('shopping_list_items_list_product_unique').on(
      table.shoppingListId,
      table.productBarcode
    ),
    shoppingListIdIdx: index('shopping_list_items_shopping_list_id_idx').on(table.shoppingListId),
    updatedAtIdx: index('shopping_list_items_updated_at_idx').on(table.updatedAt),
  })
);
