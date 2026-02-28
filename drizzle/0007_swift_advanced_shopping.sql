CREATE TABLE IF NOT EXISTS `shopping_lists` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `store_id` integer,
  `status` text NOT NULL DEFAULT 'active',
  `created_at` integer NOT NULL,
  `updated_at` integer NOT NULL,
  FOREIGN KEY (`store_id`) REFERENCES `stores`(`id`)
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `shopping_lists_status_idx` ON `shopping_lists` (`status`);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `shopping_lists_created_at_idx` ON `shopping_lists` (`created_at`);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `shopping_lists_store_id_idx` ON `shopping_lists` (`store_id`);
--> statement-breakpoint
INSERT INTO `shopping_lists` (`store_id`, `status`, `created_at`, `updated_at`)
SELECT
  (SELECT `id` FROM `stores` WHERE `is_active` = 1 ORDER BY `id` ASC LIMIT 1),
  'active',
  CAST(strftime('%s','now') AS integer) * 1000,
  CAST(strftime('%s','now') AS integer) * 1000
WHERE EXISTS (SELECT 1 FROM `shopping_list_items`) AND NOT EXISTS (SELECT 1 FROM `shopping_lists`);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `shopping_list_items_new` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `shopping_list_id` integer NOT NULL,
  `product_barcode` text NOT NULL,
  `product_name` text,
  `price_cents` integer,
  `quantity` integer NOT NULL DEFAULT 1,
  `is_checked` integer NOT NULL DEFAULT 0,
  `created_at` integer NOT NULL,
  `updated_at` integer NOT NULL,
  FOREIGN KEY (`shopping_list_id`) REFERENCES `shopping_lists`(`id`),
  FOREIGN KEY (`product_barcode`) REFERENCES `products`(`barcode`)
);
--> statement-breakpoint
INSERT INTO `shopping_list_items_new` (
  `shopping_list_id`,
  `product_barcode`,
  `product_name`,
  `quantity`,
  `is_checked`,
  `created_at`,
  `updated_at`
)
SELECT
  COALESCE((SELECT `id` FROM `shopping_lists` ORDER BY `id` ASC LIMIT 1), 1),
  `product_barcode`,
  `product_name`,
  `quantity`,
  `is_checked`,
  `created_at`,
  `updated_at`
FROM `shopping_list_items`;
--> statement-breakpoint
DROP TABLE `shopping_list_items`;
--> statement-breakpoint
ALTER TABLE `shopping_list_items_new` RENAME TO `shopping_list_items`;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS `shopping_list_items_list_product_unique` ON `shopping_list_items` (`shopping_list_id`, `product_barcode`);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `shopping_list_items_shopping_list_id_idx` ON `shopping_list_items` (`shopping_list_id`);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `shopping_list_items_updated_at_idx` ON `shopping_list_items` (`updated_at`);
