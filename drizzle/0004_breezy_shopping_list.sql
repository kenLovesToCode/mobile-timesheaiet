CREATE TABLE IF NOT EXISTS `shopping_list_items` (
  `product_barcode` text PRIMARY KEY NOT NULL,
  `quantity` integer NOT NULL DEFAULT 1,
  `is_checked` integer NOT NULL DEFAULT 0,
  `created_at` integer NOT NULL,
  `updated_at` integer NOT NULL,
  FOREIGN KEY (`product_barcode`) REFERENCES `products`(`barcode`)
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `shopping_list_items_updated_at_idx` ON `shopping_list_items` (`updated_at`);
