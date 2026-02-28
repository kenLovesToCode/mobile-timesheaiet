import { index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

import { stores } from './stores';

export const shoppingLists = sqliteTable(
  'shopping_lists',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    storeId: integer('store_id').references(() => stores.id),
    status: text('status', { enum: ['active', 'done'] }).notNull().default('active'),
    createdAt: integer('created_at').notNull(),
    updatedAt: integer('updated_at').notNull(),
  },
  (table) => ({
    statusIdx: index('shopping_lists_status_idx').on(table.status),
    createdAtIdx: index('shopping_lists_created_at_idx').on(table.createdAt),
    storeIdIdx: index('shopping_lists_store_id_idx').on(table.storeId),
  })
);
