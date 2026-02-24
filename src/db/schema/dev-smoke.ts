import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const devSmokeRecords = sqliteTable('dev_smoke_records', {
  id: text('id').primaryKey(),
  label: text('label').notNull(),
  createdAt: integer('created_at').notNull(),
});
